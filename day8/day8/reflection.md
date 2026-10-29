# Day 8 Reflection

**Most difficult concept and how I overcame it**

The hardest concept for me was concurrency, especially how two requests that each look correct can still break the system when they run at the same moment. At first, "check if the seat is free, then mark it sold" seemed completely safe. I overcame the confusion by drawing a timeline for two users, writing down what each request reads and writes at every step, and seeing exactly where they overlap. That made the fix clear: make the check and the update one atomic transaction, and let a database constraint act as the final safety net. Explaining it in my own words, as I did in the TicketHub design, helped it stick.

**What I would improve in my capstone**

Based on the feedback I received, I would make my estimates more detailed. My numbers for the big sale rely on assumptions, such as ten requests per buyer and three hold attempts, and I would explain and test those more carefully. I would also add a section on failure cases, such as the database primary going down during a sale, and describe how the system recovers. Finally, I would add a diagram showing the order of events for a hold and a payment.

**What I will learn next**

Next, I want to learn how to build and test a small version of this design. I plan to practise writing real SQL transactions and load testing them with many simultaneous users. After that, I will study caching, message queues and database scaling in more depth, so that I can design systems that handle growth.
