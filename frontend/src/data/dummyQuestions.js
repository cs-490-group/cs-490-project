export const dummyQuestions = [
  // ============================================================================
  // SOFTWARE ENGINEER - ROLE-001
  // ============================================================================

  {
    uuid: "q-001",
    role_uuid: "role-001",
    category: "behavioral",
    difficulty: "entry",
    prompt: "Tell me about a time you had to debug a complex issue in production.",
    expected_skills: ["Problem Solving", "Debugging", "Communication"],
    interviewer_guidance:
      "They want to see your debugging methodology, how you stay calm under pressure, and your communication with team members.",
    star_framework: {
      s: "I was working on a backend service handling payment transactions...",
      t: "A critical bug was causing transactions to fail intermittently in production...",
      a: "I immediately checked the logs, identified the race condition in the database write...",
      r: "I deployed a hotfix within 30 minutes, preventing $10K in potential losses.",
    },
    sample_answers: [
      "I discovered a memory leak by analyzing heap dumps and used profiling tools to identify the source. After fixing it, memory usage dropped by 40%.",
      "During a deployment, database connections were timing out. I traced the issue to connection pool misconfiguration and fixed it, reducing errors from 5% to 0%.",
    ],
    company_context: [
      "Our platform processes 10M+ transactions daily",
      "Production uptime is critical for revenue",
    ],
  },

  {
    uuid: "q-002",
    role_uuid: "role-001",
    category: "behavioral",
    difficulty: "mid",
    prompt:
      "Describe a situation where you had to work with a difficult team member. How did you handle it?",
    expected_skills: ["Teamwork", "Conflict Resolution", "Emotional Intelligence"],
    interviewer_guidance:
      "Look for maturity, empathy, and constructive problem-solving. Avoid negativity about the colleague.",
    star_framework: {
      s: "In my last role, I worked with a senior developer who was resistant to code reviews...",
      t: "This was blocking our sprint velocity and creating tension in the team...",
      a: "I initiated a one-on-one conversation to understand their perspective...",
      r: "We established a review process they were comfortable with, and team velocity increased by 30%.",
    },
    sample_answers: [
      "I realized they preferred async reviews over live discussions. I adapted my approach and proposed a Slack-based review system which they appreciated.",
      "Instead of escalating, I suggested pair programming sessions which helped them feel heard and built stronger team chemistry.",
    ],
    company_context: [
      "We value collaborative problem-solving",
      "Team dynamics affect productivity",
    ],
  },

  {
    uuid: "q-003",
    role_uuid: "role-001",
    category: "technical",
    difficulty: "entry",
    prompt:
      "Explain the difference between REST and GraphQL APIs. When would you use each?",
    expected_skills: ["API Design", "System Design", "Architecture"],
    interviewer_guidance:
      "Candidates should understand trade-offs: REST is simpler and more standardized, GraphQL is flexible but more complex.",
    star_framework: null,
    sample_answers: [
      "REST uses fixed endpoints for resources with predetermined response shapes. GraphQL lets clients request exactly the fields they need, reducing bandwidth. Use REST for simple CRUD operations; GraphQL for complex data requirements.",
      "REST is cacheable at the HTTP level and easier to understand. GraphQL requires custom caching strategies but provides excellent developer experience for complex queries.",
    ],
    company_context: null,
  },

  {
    uuid: "q-004",
    role_uuid: "role-001",
    category: "technical",
    difficulty: "mid",
    prompt:
      "Design a system to handle rate limiting for API endpoints. What approach would you take?",
    expected_skills: ["System Design", "Scalability", "Concurrency"],
    interviewer_guidance:
      "Listen for: token bucket algorithm, sliding window logs, distributed rate limiting, Redis/Memcached usage.",
    star_framework: null,
    sample_answers: [
      "I'd use a token bucket algorithm with Redis as the backing store. Each endpoint has a bucket that refills at a fixed rate. When a request arrives, check if tokens are available. This handles burst traffic well.",
      "For distributed systems, I'd implement sliding window logs in Redis. For each user, store request timestamps and check if the count exceeds limits. It's more accurate than token bucket for strict limits.",
    ],
    company_context: ["We serve millions of API calls daily", "Cost efficiency is critical"],
  },

  {
    uuid: "q-005",
    role_uuid: "role-001",
    category: "situational",
    difficulty: "entry",
    prompt:
      "You realize mid-sprint that a key feature will take longer than estimated. What do you do?",
    expected_skills: ["Time Management", "Communication", "Accountability"],
    interviewer_guidance:
      "Look for proactive communication and realistic planning. Avoid blaming others or hiding the issue.",
    star_framework: {
      s: "I was working on an authentication feature estimated at 5 story points...",
      t: "By day 3, I realized OAuth integration was more complex than expected...",
      a: "I immediately informed the tech lead and suggested breaking it into two sprints...",
      r: "We re-prioritized the backlog and delivered the core feature on time.",
    },
    sample_answers: [
      "I flag it early to the team, provide a revised estimate, and suggest which work can be deferred to next sprint.",
      "I analyze what can be delivered incrementally versus what needs more time, and present options to the product manager.",
    ],
    company_context: [
      "We use agile/scrum methodology",
      "Sprint planning is weekly",
    ],
  },

  {
    uuid: "q-006",
    role_uuid: "role-001",
    category: "company",
    difficulty: "mid",
    prompt:
      "Our platform needs to scale from 100K to 10M concurrent users. What's your approach?",
    expected_skills: [
      "Scalability",
      "Database Design",
      "Infrastructure",
      "Problem Solving",
    ],
    interviewer_guidance:
      "They want to see systematic thinking: database sharding, caching, load balancing, monitoring.",
    star_framework: null,
    sample_answers: [
      "I'd start with profiling to identify bottlenecks. Likely candidates: database queries, API latency. Then: implement Redis caching, database replication, horizontal scaling of services, CDN for static assets.",
      "Create a capacity planning document. Set up auto-scaling groups, implement database sharding by user ID, use message queues for async work, and add comprehensive monitoring/alerting.",
    ],
    company_context: [
      "Current scale: 100K concurrent users",
      "Growth target: 10M users",
      "We need to do this cost-effectively",
    ],
  },

  // ============================================================================
  // SOFTWARE ENGINEER - ROLE-002 (Senior)
  // ============================================================================

  {
    uuid: "q-007",
    role_uuid: "role-002",
    category: "behavioral",
    difficulty: "senior",
    prompt:
      "Tell me about a time you had to make a difficult technical decision that impacted the entire team.",
    expected_skills: [
      "Leadership",
      "Decision Making",
      "Technical Judgment",
      "Communication",
    ],
    interviewer_guidance:
      "Senior engineers should show collaborative decision-making, consideration of trade-offs, and team alignment.",
    star_framework: {
      s: "Our architecture was becoming a bottleneck as we scaled to millions of users...",
      t: "We needed to choose between refactoring the monolith or migrating to microservices...",
      a: "I led a working group to analyze both approaches, modeling migration costs and benefits...",
      r: "We chose a hybrid approach, extracting critical services first. This reduced technical debt while minimizing risk.",
    },
    sample_answers: [
      "I advocated for moving from our custom message queue to Kafka, which was initially unpopular. I built a business case showing 60% cost reduction and 10x throughput increase. After pilots, the team agreed.",
      "I pushed back on a feature request because the architecture couldn't support it without major refactoring. I presented the technical constraints clearly, and we adjusted the product roadmap.",
    ],
    company_context: [
      "Technical decisions impact 50+ engineers",
      "We value data-driven decisions",
    ],
  },

  // ============================================================================
  // FRONTEND ENGINEER - ROLE-004
  // ============================================================================

  {
    uuid: "q-008",
    role_uuid: "role-004",
    category: "technical",
    difficulty: "entry",
    prompt: "How do you optimize React component performance?",
    expected_skills: [
      "React",
      "Performance",
      "Code Optimization",
      "Debugging",
    ],
    interviewer_guidance:
      "Look for: React.memo, useCallback, useMemo, code splitting, lazy loading, profiling.",
    star_framework: null,
    sample_answers: [
      "Use React.memo for components that don't need frequent re-renders. Memoize expensive callbacks with useCallback. Lazy load routes with React.lazy. Profile with React DevTools to identify bottlenecks.",
      "Implement code splitting to reduce bundle size. Use useCallback and useMemo carefully. Avoid inline function definitions. Use virtualization for long lists.",
    ],
    company_context: [
      "Our app has 500+ components",
      "Users expect sub-second interactions",
    ],
  },

  // ============================================================================
  // DATA SCIENTIST - ROLE-006
  // ============================================================================

  {
    uuid: "q-009",
    role_uuid: "role-006",
    category: "behavioral",
    difficulty: "mid",
    prompt:
      "Tell me about a machine learning project where your model didn't work as expected. How did you handle it?",
    expected_skills: [
      "Problem Solving",
      "Data Analysis",
      "Resilience",
      "Communication",
    ],
    interviewer_guidance:
      "They want to see debugging methodology, not just technical knowledge. How do you investigate and communicate failures?",
    star_framework: {
      s: "I built a recommendation model that showed 95% accuracy on validation data...",
      t: "But in production, it only improved click-through rate by 2% instead of the expected 15%...",
      a: "I analyzed the data distribution differences and discovered training/serving skew...",
      r: "After retraining with production data, CTR improved to 12%. The lesson: always validate in production.",
    },
    sample_answers: [
      "I discovered my model was overfitting to historical patterns. I implemented cross-validation and regularization, which reduced accuracy slightly but improved production performance by 20%.",
      "The model looked great until A/B testing revealed users didn't like the recommendations. I adjusted the loss function to balance accuracy with diversity, and engagement improved.",
    ],
    company_context: [
      "We serve billions of recommendations monthly",
      "Small improvements in relevance affect revenue significantly",
    ],
  },

  {
    uuid: "q-010",
    role_uuid: "role-006",
    category: "technical",
    difficulty: "mid",
    prompt:
      "How would you approach building a recommendation system for an e-commerce platform?",
    expected_skills: [
      "Machine Learning",
      "System Design",
      "Feature Engineering",
      "SQL",
    ],
    interviewer_guidance:
      "Structure: data collection → feature engineering → model selection → evaluation → deployment. Look for practical considerations.",
    star_framework: null,
    sample_answers: [
      "Start with collaborative filtering on user-item interactions. Collect features: user demographics, item metadata, behavior. Build multiple models: content-based, collaborative, and hybrid. A/B test to find the best approach.",
      "Use implicit feedback (clicks, purchases). Implement matrix factorization with negative sampling. Add business rules to avoid recommending similar items. Monitor diversity and coverage metrics.",
    ],
    company_context: [
      "E-commerce platform with 10M products",
      "100M monthly active users",
    ],
  },

  // ============================================================================
  // PRODUCT MANAGER - ROLE-010
  // ============================================================================

  {
    uuid: "q-011",
    role_uuid: "role-010",
    category: "behavioral",
    difficulty: "mid",
    prompt:
      "Tell me about a product decision you made that turned out wrong. How did you respond?",
    expected_skills: [
      "Accountability",
      "Data-Driven Thinking",
      "Learning Mindset",
      "Communication",
    ],
    interviewer_guidance:
      "Look for: acknowledging mistakes, analyzing what went wrong, course correction, communication with stakeholders.",
    star_framework: {
      s: "I championed a feature we thought users desperately wanted based on support tickets...",
      t: "After launch, adoption was only 5% despite significant engineering effort...",
      a: "I analyzed the issue and realized I was optimizing for a loud minority...",
      r: "I killed the feature, communicated the learning to stakeholders, and established better validation processes.",
    },
    sample_answers: [
      "I launched a new onboarding flow without enough user testing. When churn increased by 3%, I immediately reverted and did proper user research before redesigning.",
      "I pushed for a premium feature that didn't convert. I owned the mistake, analyzed why, and worked with design to create a simpler, freemium version that succeeded.",
    ],
    company_context: [
      "We ship fast and iterate based on data",
      "Bad launches impact engineering morale",
    ],
  },

  {
    uuid: "q-012",
    role_uuid: "role-010",
    category: "technical",
    difficulty: "entry",
    prompt:
      "How would you measure the success of a new feature launch?",
    expected_skills: ["Metrics", "Analytics", "Product Sense", "Data Analysis"],
    interviewer_guidance:
      "Look for: defining success metrics upfront, leading/lagging indicators, experimentation approach.",
    star_framework: null,
    sample_answers: [
      "Define success metrics before launch: adoption rate, engagement metrics, retention impact. Set target thresholds. Run A/B test to ensure causality. Monitor daily for the first week, then weekly.",
      "Identify leading indicators (usage) and lagging indicators (revenue impact). Set up dashboards for real-time monitoring. Run cohort analysis to understand which users benefit most.",
    ],
    company_context: [
      "We launch 2-3 features per sprint",
      "Data-driven culture is critical",
    ],
  },

  // ============================================================================
  // DATA ENGINEER - ROLE-007
  // ============================================================================

  {
    uuid: "q-013",
    role_uuid: "role-007",
    category: "technical",
    difficulty: "mid",
    prompt:
      "Design a data pipeline to process 10TB of logs daily for analytics.",
    expected_skills: [
      "Data Engineering",
      "System Design",
      "Big Data Tools",
      "Scalability",
    ],
    interviewer_guidance:
      "Look for: batch vs streaming considerations, tool selection, data quality, cost optimization.",
    star_framework: null,
    sample_answers: [
      "Use Kafka for real-time ingestion. Batch processing with Spark daily. Store in Parquet format on S3. Use Athena for querying. Partition by date for fast queries. Implement data validation at each stage.",
      "Ingest via Kinesis or Kafka. Process with Apache Flink for real-time aggregations. Store raw data in S3, processed data in Redshift. Monitor pipeline health with CloudWatch.",
    ],
    company_context: [
      "10TB logs daily",
      "Need sub-minute query latency for dashboards",
      "Cost is a major constraint",
    ],
  },

  // ============================================================================
  // UX DESIGNER - ROLE-011
  // ============================================================================

  {
    uuid: "q-014",
    role_uuid: "role-011",
    category: "behavioral",
    difficulty: "entry",
    prompt:
      "Tell me about a design project where your original idea didn't work. How did you iterate?",
    expected_skills: ["Design Process", "User Research", "Iteration", "Communication"],
    interviewer_guidance:
      "Look for: user-centered approach, willingness to embrace feedback, iterative methodology.",
    star_framework: {
      s: "I designed a complex navigation system with deep hierarchies...",
      t: "User testing revealed 60% of users couldn't find key features...",
      a: "I simplified the navigation, conducted more user research, and tested multiple alternatives...",
      r: "The new design increased feature discovery by 40% and reduced support tickets.",
    },
    sample_answers: [
      "I user tested my design with 5 users and realized the icon metaphor I chose wasn't intuitive. I iterated with different icon sets, tested again, and found one that worked.",
      "The design looked great but was not accessible. I learned WCAG guidelines and redesigned to meet AA standards, which also improved usability for all users.",
    ],
    company_context: [
      "Accessibility is a core value",
      "Users span all technical skill levels",
    ],
  },

  // ============================================================================
  // SALES EXECUTIVE - ROLE-016
  // ============================================================================

  {
    uuid: "q-015",
    role_uuid: "role-016",
    category: "behavioral",
    difficulty: "entry",
    prompt:
      "Tell me about a challenging sales situation where you had to overcome objections.",
    expected_skills: ["Sales", "Negotiation", "Problem Solving", "Resilience"],
    interviewer_guidance:
      "Look for: understanding customer pain points, creative problem-solving, persistence without being pushy.",
    star_framework: {
      s: "A prospect was interested in our product but had a limited budget...",
      t: "Their objection was valid - they couldn't afford the enterprise plan...",
      a: "I worked with our product team to create a custom starter plan...",
      r: "The deal closed at $50K, and the customer expanded to enterprise 6 months later.",
    },
    sample_answers: [
      "A prospect said our tool was too expensive. Instead of defending price, I asked about their actual use case. Turned out they only needed 20% of features. I showed them the starter plan, and they bought.",
      "A competitor had a lower price. I focused on our superior customer support and ROI metrics. The prospect valued support highly, so we won.",
    ],
    company_context: [
      "Average deal size: $100K",
      " 90-day sales cycle typical",
    ],
  },

  // ============================================================================
  // FULL-STACK DEVELOPER - ROLE-003
  // ============================================================================

  {
    uuid: "q-016",
    role_uuid: "role-003",
    category: "technical",
    difficulty: "mid",
    prompt:
      "Design a schema for a Twitter-like social media platform. What tables would you create?",
    expected_skills: ["Database Design", "SQL", "Scalability", "System Design"],
    interviewer_guidance:
      "Look for normalized schema, consideration of queries, indexes, and scale.",
    star_framework: null,
    sample_answers: [
      "Users table, Tweets table with foreign key to Users, Follows table for relationships, Likes table. Add indexes on user_id, created_at for fast queries.",
      "Users, Tweets, Follows, Likes, Comments. Denormalize tweet_count on Users table for fast retrieval. Partition by date for timeline queries. Consider eventual consistency for distributed system.",
    ],
    company_context: [
      "Billions of tweets annually",
      "Timeline queries are the most common",
    ],
  },

  // More questions can be added...
];
