# SnapShare Scaling Plan (10 million registered users)

SnapShare is a photo-sharing app. Users upload photos and scroll a feed of photos from people they follow.

## 1. Assumptions

- 10,000,000 registered users
- 10% of them are active on a given day
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- An average photo is 2 MB; each photo also gets a 50 KB thumbnail
- 1 day is about 100,000 seconds (rounded from 86,400 for easy maths)
- Peak traffic is 5x the average
- 1 KB = 1,000 bytes, 1 MB = 1,000 KB, 1 GB = 1,000 MB, 1 TB = 1,000 GB

**Daily active users (DAU):** 10,000,000 x 10% = **1,000,000 DAU**

## 2. Estimates

```
Uploads (writes):
  1,000,000 users x 1 photo        = 1,000,000 uploads per day
  1,000,000 / 100,000              = 10 uploads per second (average)
  Peak (x5)                        = 50 uploads per second

Feed views (reads):
  1,000,000 users x 50 views       = 50,000,000 feed views per day
  50,000,000 / 100,000             = 500 feed views per second (average)
  Peak (x5)                        = 2,500 feed views per second

Photo storage per year:
  Originals:   1,000,000 x 2 MB    = 2,000,000 MB = 2 TB per day
               2 TB x 365          = 730 TB per year
  Thumbnails:  1,000,000 x 50 KB   = 50 GB per day
               50 GB x 365         = 18,250 GB = about 18 TB per year
  Total                            = about 750 TB per year
```

Database rows (photo id, owner, URLs, timestamp) are tiny by comparison: at about 1 KB per photo, that is roughly 1 GB per day, or about 365 GB per year. The photo files are what make storage large.

## 3. Read-heavy or write-heavy?

SnapShare is **read-heavy**. There are 500 feed views per second against 10 uploads per second, which is **50 times more reads than writes**.

What this means for the design:

- **Cache reads aggressively.** Keep feeds and photo metadata in Redis so most feed views never reach the database.
- **Use read replicas.** Feed queries go to replicas; only the primary handles writes.
- **Serve photos through a CDN.** Images are the heaviest part of every feed view, so they should come from a nearby edge server.
- **Writes can stay simple.** Only 50 uploads per second at peak is manageable, and slow work (thumbnails) can go to a queue.

Peak reads of 2,500 per second are too much for one server and one database, so this system does need horizontal scaling, unlike QuickNotes.

## 4. Why photos should not be stored in the database

- **Size.** At 730 TB per year, the originals would swamp the database. Databases are built for small structured rows, not huge binary files.
- **Cost.** Database storage is much more expensive per GB than object storage.
- **Speed.** Large files in the database slow down queries, backups, and replication to the replicas.
- **Delivery.** A database cannot hand files to a CDN efficiently, while object storage is designed for that.

**Where they go instead:** object storage (for example Amazon S3 or Google Cloud Storage). It is cheap, scales almost without limit, and keeps copies for durability. The database stores only the **URL (path) of each photo** plus metadata such as owner and upload time.

## 5. Architecture diagram

```
                         +---------+
          +------------->|   DNS   |  (snapshare.com -> IP addresses)
          |              +---------+
 +--------+-------+   static files + photos   +-----------------------+
 | Browser /      | ------------------------> | CDN (HTML/CSS/JS,     |
 | mobile client  |                           | photos, thumbnails)   |
 +--------+-------+                           +-----------+-----------+
          |                                               | (miss only)
          | API calls (HTTPS, JSON)                       v
          v                                    +----------------------+
   +---------------+                           |   OBJECT STORAGE     |
   | Load balancer |                           | originals+thumbnails |
   +-------+-------+                           +----------^-----------+
      +----+------+----------+                            |
      v           v          v                            | save / read files
  +-------+   +-------+   +-------+     +--------------+  |
  | App 1 |   | App 2 |   | App 3 |---->| Cache(Redis) |  |
  +---+---+   +---+---+   +---+---+     +--------------+  |
      |           |           |                           |
      | writes    | reads     | add job                   |
      v           v           v                           |
 +---------+  +----------+  +-------+   +--------+        |
 | Primary |->| Read     |  | Queue |-->| Worker |--------+
 |   DB    |  | replica  |  +-------+   +--------+
 +---------+  +----------+              (makes thumbnails)
```

Load estimate (corner note): 1M DAU | 10 uploads/s (50 peak) | 500 feed views/s (2,500 peak) | about 750 TB/year | 50:1 read-heavy

## 6. What each component does (one sentence each)

- **DNS:** turns snapshare.com into the IP address of the right servers so users can find the app.
- **CDN:** serves the front-end files and photos from an edge server near the user, cutting latency and keeping heavy image traffic off our servers.
- **Load balancer:** spreads requests across the app servers and skips unhealthy ones, so no single server is overloaded or a single point of failure.
- **App servers (several, stateless):** run the API logic, and because there are several, one crashing does not take the app down and we can add more as load grows.
- **Cache (Redis):** keeps feeds and metadata in memory so most of the 2,500 peak reads per second are answered in about 1 ms without touching the database.
- **Primary database:** holds the one true copy of users, follows, and photo metadata, and is the only component that accepts writes.
- **Read replica:** copies the primary and answers read queries, spreading the heavy read load away from the primary.
- **Object storage:** stores the photo files cheaply and almost without limit, so the database stays small and fast.
- **Message queue:** holds thumbnail jobs so the app can reply to the user immediately, and absorbs bursts of uploads instead of being overloaded.
- **Worker:** takes jobs from the queue in the background and creates the 50 KB thumbnails, so uploads stay fast.

## 7. Upload flow, step by step

1. The user picks a photo and the browser sends `POST /photos` (about 2 MB) to the load balancer.
2. The load balancer forwards the request to a healthy app server.
3. The app server checks the token to identify the user, and validates the file (type and size).
4. The app server saves the original photo to **object storage** and gets back its URL.
5. The app server writes a row to the **primary database**: photo id, owner, original URL, upload time, and thumbnail status "processing".
6. The app server adds a job to the **queue**: "create thumbnail for photo 123".
7. The app server replies **201 Created** straight away. The user does not wait for the thumbnail.
8. A **worker** takes the job from the queue, reads the original from object storage, and creates a 50 KB thumbnail.
9. The worker saves the thumbnail to object storage and updates the database row with the thumbnail URL and status "ready".
10. The worker (or the app) deletes the affected cached feeds from Redis, or relies on a short TTL, so followers see the new photo on their next feed load.
11. The primary copies the new row to the read replica within a few milliseconds.
12. Followers load their feed: the app checks the cache, falls back to a read replica on a miss, and the browser fetches thumbnails from the CDN.

If a worker crashes mid-job, the job returns to the queue and another worker retries it, so no thumbnail is lost.

## 8. Trade-offs

1. **Speed versus freshness.** Caching feeds and using read replicas makes feeds fast, but a follower may see a feed that is a few seconds out of date (cache TTL and replication lag). This is acceptable for a photo feed, where a one-minute delay harms nobody, unlike a bank balance.
2. **Simplicity versus scalability.** One server would be far easier to build and debug, but 2,500 peak reads per second and 750 TB per year cannot fit on one machine. We accept the extra complexity of a load balancer, cache, replica, and queue, but we avoid sharding and microservices until clearly needed (a well-organised monolith first).
3. **Cost versus reliability.** More app servers, replicas, and stored copies improve uptime but cost more money. Storing 750 TB per year is expensive, so options such as moving old photos to cheaper storage or compressing images may be worth considering later.
4. **Asynchronous thumbnails: responsiveness versus completeness.** Using a queue keeps uploads fast, but for a short time the photo has no thumbnail yet. The app can show a placeholder until the worker finishes.