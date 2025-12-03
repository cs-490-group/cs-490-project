import json
import random
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from openai import OpenAI
from mongo.technical_prep_dao import technical_prep_dao
from schema.TechnicalChallenge import (
    TechnicalChallenge, CodingChallenge, TestCase, SolutionFramework,
    SystemDesignQuestion, CaseStudy, ChallengeAttempt
)

# Default coding challenges templates
CODING_CHALLENGES_TEMPLATES = [
    {
        "title": "Two Sum",
        "description": """Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: The sum of nums[0] and nums[1] is 9. We return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
Explanation: The sum of nums[1] and nums[2] is 6. We return [1, 2].

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]
Explanation: The sum of nums[0] and nums[1] is 6. We return [0, 1].

Constraints:
• 2 <= nums.length <= 10^4
• -10^9 <= nums[i] <= 10^9
• -10^9 <= target <= 10^9
• Only one valid answer exists.

Note:
• You cannot use the same element twice.
• The returned indices do not need to be in order.
""",
        "difficulty": "easy",
        "required_languages": ["Python", "JavaScript", "Java"],
        "required_skills": ["Arrays", "Hash Maps"],
        "time_limit_minutes": 30,
        "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
        "example_input": "nums = [2,7,11,15], target = 9",
        "example_output": "[0,1]",
        "coding_challenge": {
            "title": "Two Sum",
            "description": """Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input has exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: The sum of nums[0] and nums[1] is 9. We return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
Explanation: The sum of nums[1] and nums[2] is 6. We return [1, 2].

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]
Explanation: The sum of nums[0] and nums[1] is 6. We return [0, 1].

Constraints:
• 2 <= nums.length <= 10^4
• -10^9 <= nums[i] <= 10^9
• -10^9 <= target <= 10^9
• Only one valid answer exists.

Note:
• You cannot use the same element twice.
• The returned indices do not need to be in order.
""",
            "difficulty": "easy",
            "required_languages": ["Python", "JavaScript", "Java"],
            "required_skills": ["Arrays", "Hash Maps"],
            "time_limit_minutes": 30,
            "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9"],
            "test_cases": [
                {"input": {"nums": [2, 7, 11, 15], "target": 9}, "expected_output": [0, 1], "description": "Basic case"},
                {"input": {"nums": [3, 2, 4], "target": 6}, "expected_output": [1, 2], "description": "Another case"},
            ],
            "solution_framework": {
                "title": "Hash Map Approach",
                "overview": "Use a hash map to store values and their indices for O(n) solution",
                "steps": [
                    "Create an empty hash map",
                    "Iterate through the array",
                    "For each number, check if (target - number) exists in hash map",
                    "If exists, return both indices",
                    "Otherwise, add current number and index to hash map"
                ],
                "pseudocode": """
hash_map = {}
for i, num in enumerate(nums):
    complement = target - num
    if complement in hash_map:
        return [hash_map[complement], i]
    hash_map[num] = i
return []
                """,
                "solution_code": {
                    "python": """def twoSum(nums, target):
    # Dictionary to store value and its index
    num_map = {}

    for i, num in enumerate(nums):
        # Check if complement exists in map
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        # Store current number and index
        num_map[num] = i

    return []  # No solution found""",
                    "javascript": """function twoSum(nums, target) {
    // Map to store value and its index
    const numMap = new Map();

    for (let i = 0; i < nums.length; i++) {
        // Check if complement exists in map
        const complement = target - nums[i];
        if (numMap.has(complement)) {
            return [numMap.get(complement), i];
        }
        // Store current number and index
        numMap.set(nums[i], i);
    }

    return [];  // No solution found
}""",
                    "java": """public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // HashMap to store value and its index
        Map<Integer, Integer> numMap = new HashMap<>();

        for (int i = 0; i < nums.length; i++) {
            // Check if complement exists in map
            int complement = target - nums[i];
            if (numMap.containsKey(complement)) {
                return new int[]{numMap.get(complement), i};
            }
            // Store current number and index
            numMap.put(nums[i], i);
        }

        return new int[]{};  // No solution found
    }
}"""
                },
                "time_complexity": "O(n)",
                "space_complexity": "O(n)",
                "common_mistakes": [
                    "Using nested loops (O(n^2)) instead of hash map",
                    "Not handling duplicate values correctly",
                    "Using same element twice"
                ],
                "alternative_approaches": [
                    "Brute force nested loops O(n^2)",
                    "Two pointer approach on sorted array"
                ],
                "real_world_correlation": "This appears in recommendation systems where you need to find matching pairs efficiently",
                "whiteboard_checklist": [
                    "Clarify if we can use the same element twice",
                    "Confirm return format (indices or values)",
                    "Discuss space/time tradeoffs"
                ]
            },
            "follow_up_questions": [
                "What if we need to return all pairs?",
                "Can we solve it with O(1) space?",
                "How would you handle duplicates?"
            ]
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["array", "hash-map", "two-pointer"]
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "description": "Given a string s, find the length of the longest substring without repeating characters.",
        "difficulty": "medium",
        "required_languages": ["Python", "JavaScript", "Java"],
        "required_skills": ["Strings", "Sliding Window"],
        "time_limit_minutes": 40,
        "constraints": ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces"],
        "coding_challenge": {
            "title": "Longest Substring Without Repeating Characters",
            "description": "Given a string s, find the length of the longest substring without repeating characters.",
            "difficulty": "medium",
            "required_languages": ["Python", "JavaScript", "Java"],
            "required_skills": ["Strings", "Sliding Window"],
            "time_limit_minutes": 40,
            "constraints": ["0 <= s.length <= 5 * 10^4"],
            "test_cases": [
                {"input": {"s": "abcabcbb"}, "expected_output": 3, "description": "abc"},
                {"input": {"s": "bbbbb"}, "expected_output": 1, "description": "b"},
                {"input": {"s": "pwwkew"}, "expected_output": 3, "description": "wke"},
            ],
            "solution_framework": {
                "title": "Sliding Window with Hash Set",
                "overview": "Use sliding window technique with a hash set to track characters",
                "steps": [
                    "Initialize left pointer and empty hash set",
                    "Expand right pointer and add characters",
                    "If duplicate found, shrink from left until no duplicate",
                    "Track maximum length"
                ],
                "time_complexity": "O(n)",
                "space_complexity": "O(min(m, n)) where m is charset size",
                "common_mistakes": [
                    "Not removing characters when shrinking window",
                    "Not tracking max length correctly"
                ],
                "alternative_approaches": [
                    "Using dictionary to track character indices",
                    "Two nested loops (O(n^2))"
                ],
                "real_world_correlation": "Token identification in compilers uses similar sliding window concepts",
                "whiteboard_checklist": [
                    "Define what 'substring' means",
                    "Discuss charset size implications",
                    "Explain sliding window movement"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["string", "sliding-window", "hash-set"]
    },
    {
        "title": "Merge k Sorted Lists",
        "description": "Merge k sorted linked lists and return it as one sorted list.",
        "difficulty": "hard",
        "required_languages": ["Python", "JavaScript", "Java"],
        "required_skills": ["Linked Lists", "Heap", "Divide and Conquer"],
        "time_limit_minutes": 45,
        "constraints": ["k >= 0", "n (total nodes) <= 10^4"],
        "coding_challenge": {
            "title": "Merge k Sorted Lists",
            "description": "Merge k sorted linked lists and return it as one sorted list.",
            "difficulty": "hard",
            "required_languages": ["Python", "JavaScript", "Java"],
            "required_skills": ["Linked Lists", "Heap", "Divide and Conquer"],
            "time_limit_minutes": 45,
            "test_cases": [
                {"input": {"lists": [[1,4,5], [1,3,4], [2,6]]}, "expected_output": [1,1,2,1,3,4,4,5,6], "description": "Multiple sorted lists"},
                {"input": {"lists": []}, "expected_output": [], "description": "Empty input"},
            ],
            "solution_framework": {
                "title": "Merge k Sorted Lists using Min Heap",
                "overview": "Use a min heap to efficiently merge k sorted lists in O(n log k) time",
                "steps": [
                    "Create a min heap with first element of each list",
                    "Pop minimum element, add to result",
                    "Push next element from same list to heap",
                    "Repeat until heap is empty"
                ],
                "time_complexity": "O(n log k) where n is total nodes, k is number of lists",
                "space_complexity": "O(k) for the heap",
                "common_mistakes": [
                    "Using brute force O(n log n) merge",
                    "Not properly managing heap state",
                    "Null pointer handling for linked lists"
                ],
                "alternative_approaches": [
                    "Pair-wise merging: O(n log k)",
                    "Compare one by one: O(nk)"
                ],
                "real_world_correlation": "Database query result merging, external sorting",
                "whiteboard_checklist": [
                    "Understand linked list structure",
                    "Explain min heap operations",
                    "Discuss time/space tradeoffs"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["linked-list", "heap", "hard"]
    },
    {
        "title": "Median of Two Sorted Arrays",
        "description": "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
        "difficulty": "hard",
        "required_languages": ["Python", "JavaScript", "Java"],
        "required_skills": ["Arrays", "Binary Search", "Math"],
        "time_limit_minutes": 45,
        "constraints": ["nums1.length == m", "nums2.length == n", "0 <= m <= 1000", "0 <= n <= 1000"],
        "coding_challenge": {
            "title": "Median of Two Sorted Arrays",
            "description": "Given two sorted arrays, return the median of the two sorted arrays.",
            "difficulty": "hard",
            "required_languages": ["Python", "JavaScript", "Java"],
            "required_skills": ["Arrays", "Binary Search", "Math"],
            "time_limit_minutes": 45,
            "test_cases": [
                {"input": {"nums1": [1,3], "nums2": [2]}, "expected_output": 2.0, "description": "Odd total length"},
                {"input": {"nums1": [1,2], "nums2": [3,4]}, "expected_output": 2.5, "description": "Even total length"},
            ],
            "solution_framework": {
                "title": "Binary Search on Partition",
                "overview": "Use binary search to find the correct partition point in one array",
                "steps": [
                    "Binary search on the smaller array",
                    "Find partition point where left side has equal elements as right side",
                    "Calculate median from partition boundaries",
                    "Handle edge cases for odd/even lengths"
                ],
                "time_complexity": "O(log(min(m, n)))",
                "space_complexity": "O(1)",
                "common_mistakes": [
                    "Incorrect partition logic",
                    "Not handling odd/even cases",
                    "Off-by-one errors in binary search"
                ],
                "alternative_approaches": [
                    "Merge arrays: O(m+n)",
                    "Two pointers: O(m+n)"
                ],
                "real_world_correlation": "Statistical analysis, data aggregation",
                "whiteboard_checklist": [
                    "Clarify input constraints",
                    "Explain binary search invariant",
                    "Discuss partition concept"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["array", "binary-search", "hard"]
    },
    {
        "title": "Serialize and Deserialize Binary Tree",
        "description": "Design an algorithm to serialize and deserialize a binary tree.",
        "difficulty": "hard",
        "required_languages": ["Python", "Java"],
        "required_skills": ["Binary Trees", "DFS/BFS", "Design"],
        "time_limit_minutes": 40,
        "constraints": ["Tree nodes <= 10^4", "Node values in range [-1000, 1000]"],
        "coding_challenge": {
            "title": "Serialize and Deserialize Binary Tree",
            "description": "Design an algorithm to serialize and deserialize a binary tree.",
            "difficulty": "hard",
            "required_languages": ["Python", "Java"],
            "required_skills": ["Binary Trees", "DFS/BFS", "Design"],
            "time_limit_minutes": 40,
            "test_cases": [
                {"input": {"root": [1,2,3,None,None,4,5]}, "expected_output": [1,2,3,None,None,4,5], "description": "Complete binary tree"},
            ],
            "solution_framework": {
                "title": "DFS-based Serialization",
                "overview": "Use pre-order traversal to serialize and deserialize",
                "steps": [
                    "Serialize: Pre-order DFS with null markers",
                    "Store in comma-separated string format",
                    "Deserialize: Reconstruct from string using queue",
                    "Build tree recursively"
                ],
                "time_complexity": "O(n) for both operations",
                "space_complexity": "O(n) for string/recursion stack",
                "common_mistakes": [
                    "Not handling null nodes properly",
                    "Incorrect reconstruction logic",
                    "Not handling edge cases (empty tree)"
                ],
                "alternative_approaches": [
                    "Level-order (BFS) serialization",
                    "Post-order traversal"
                ],
                "real_world_correlation": "Cache serialization, data persistence",
                "whiteboard_checklist": [
                    "Choose serialization format",
                    "Handle null nodes consistently",
                    "Verify with examples"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["binary-tree", "design", "hard"]
    },
    {
        "title": "LRU Cache",
        "description": "Design and implement an LRU (Least Recently Used) cache.",
        "difficulty": "medium",
        "required_languages": ["Python", "Java", "JavaScript"],
        "required_skills": ["Hash Maps", "Linked Lists", "Design"],
        "time_limit_minutes": 40,
        "constraints": ["1 <= capacity <= 3000"],
        "coding_challenge": {
            "title": "LRU Cache",
            "description": "Design and implement an LRU cache with get and put operations.",
            "difficulty": "medium",
            "required_languages": ["Python", "Java", "JavaScript"],
            "required_skills": ["Hash Maps", "Linked Lists", "Design"],
            "time_limit_minutes": 40,
            "test_cases": [
                {"input": {"ops": ["put", "put", "get", "put", "get", "get"], "args": [[1,1], [2,2], [1], [3,3], [2], [3]]}, "expected_output": [1, -1, 3], "description": "LRU eviction"},
            ],
            "solution_framework": {
                "title": "Hash Map + Doubly Linked List",
                "overview": "Combine hash map for O(1) access with doubly linked list for O(1) eviction",
                "steps": [
                    "Use hash map for O(1) node lookup",
                    "Use doubly linked list for O(1) removal/insertion",
                    "Most recently used at head, least at tail",
                    "On access, move node to head",
                    "On full cache, evict tail node"
                ],
                "time_complexity": "O(1) for both get and put",
                "space_complexity": "O(capacity)",
                "common_mistakes": [
                    "Not updating access order on get",
                    "Incorrect eviction logic",
                    "Off-by-one in capacity management"
                ],
                "alternative_approaches": [
                    "OrderedDict in Python",
                    "Python's functools.lru_cache"
                ],
                "real_world_correlation": "CPU caches, web caching, database buffer pools",
                "whiteboard_checklist": [
                    "Clarify get/put behavior",
                    "Discuss eviction policy",
                    "Analyze time/space complexity"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["design", "hash-map", "linked-list", "medium"]
    },
    {
        "title": "Regular Expression Matching",
        "description": "Implement regular expression matching with '.' and '*' support.",
        "difficulty": "hard",
        "required_languages": ["Python", "Java"],
        "required_skills": ["Dynamic Programming", "Strings"],
        "time_limit_minutes": 45,
        "constraints": ["s.length <= 20", "p.length <= 30"],
        "coding_challenge": {
            "title": "Regular Expression Matching",
            "description": "Implement regex matching with '.' (any character) and '*' (zero or more of preceding)",
            "difficulty": "hard",
            "required_languages": ["Python", "Java"],
            "required_skills": ["Dynamic Programming", "Strings"],
            "time_limit_minutes": 45,
            "test_cases": [
                {"input": {"s": "aa", "p": "a"}, "expected_output": False, "description": "Partial match"},
                {"input": {"s": "aa", "p": "a*"}, "expected_output": True, "description": "Star matching"},
                {"input": {"s": "ab", "p": ".*"}, "expected_output": True, "description": "Dot star"},
            ],
            "solution_framework": {
                "title": "Dynamic Programming Solution",
                "overview": "Use 2D DP table to track valid matches",
                "steps": [
                    "Create DP table where dp[i][j] = s[0:i] matches p[0:j]",
                    "Base cases: empty string and empty pattern",
                    "Handle '*' patterns (zero matches vs one/more matches)",
                    "Handle '.' patterns (wildcard matching)"
                ],
                "time_complexity": "O(m * n) where m=len(s), n=len(p)",
                "space_complexity": "O(m * n) for DP table",
                "common_mistakes": [
                    "Incorrect '*' handling (should match zero occurrences)",
                    "Not properly initializing DP table",
                    "Confusing pattern matching logic"
                ],
                "alternative_approaches": [
                    "Recursive with memoization",
                    "Bottom-up DP approach"
                ],
                "real_world_correlation": "Text editors, validation systems, compilers",
                "whiteboard_checklist": [
                    "Clarify wildcard behavior",
                    "Draw DP table on example",
                    "Walk through transitions"
                ]
            }
        },
        "challenge_type": "coding",
        "source": "template",
        "tags": ["dp", "string", "hard"]
    }
]

# System design questions templates - Senior level complex questions
SYSTEM_DESIGN_TEMPLATES = [
    {
        "title": "Design a URL Shortening Service",
        "challenge_type": "system_design",
        "difficulty": "senior",
        "required_skills": ["Database Design", "API Design", "Scalability"],
        "time_limit_minutes": 60,
        "system_design": {
            "title": "Design a URL Shortening Service",
            "prompt": "Design a system like bit.ly that takes long URLs and returns a shortened URL. The service should redirect users back to the original URL when they visit the short URL.",
            "difficulty": "senior",
            "required_skills": ["Database Design", "API Design", "Scalability", "Caching"],
            "time_limit_minutes": 60,
            "architecture_focus": ["Scalability", "Availability", "Latency", "Storage"],
            "evaluation_metrics": {
                "Throughput": "100K requests/second",
                "Latency": "< 100ms p99",
                "Availability": "> 99.99%"
            },
            "diagram_requirements": [
                "System architecture diagram",
                "Database schema diagram",
                "Request flow diagram"
            ],
            "solution_framework": {
                "title": "URL Shortening Architecture",
                "overview": "Distributed system with hash generation, caching, and database optimization",
                "steps": [
                    "Design API endpoints (POST /shorten, GET /{shortCode})",
                    "Choose hash algorithm (Base62 encoding or MD5)",
                    "Design database schema (id, shortCode, originalUrl, createdAt)",
                    "Implement caching layer (Redis for hot URLs)",
                    "Plan sharding strategy for database",
                    "Consider collision handling and uniqueness"
                ],
                "time_complexity": "O(1) for shortening, O(1) for redirects",
                "common_mistakes": [
                    "Using random strings without collision handling",
                    "Not considering database scalability",
                    "Ignoring cache strategy for popular URLs"
                ],
                "alternative_approaches": [
                    "Zookeeper for ID generation",
                    "Consistent hashing for sharding",
                    "Cache-aside vs Write-through patterns"
                ],
                "real_world_correlation": "Production systems like bit.ly and TinyURL use similar approaches",
                "whiteboard_checklist": [
                    "Define functional requirements",
                    "Estimate scale (QPS, storage)",
                    "Discuss bottlenecks",
                    "Propose solutions for each bottleneck"
                ]
            },
            "follow_up_questions": [
                "How would you handle duplicate long URLs?",
                "How would you track analytics?",
                "How would you implement expiration for short URLs?"
            ]
        },
        "source": "template",
        "tags": ["distributed-systems", "database-design", "scalability"]
    },
    {
        "title": "Design a Real-time Notification System",
        "challenge_type": "system_design",
        "difficulty": "senior",
        "required_skills": ["Message Queues", "Real-time Systems", "Scalability"],
        "time_limit_minutes": 60,
        "system_design": {
            "title": "Design a Real-time Notification System",
            "prompt": "Design a notification system that can handle millions of users receiving notifications in real-time. Support multiple notification channels (email, SMS, push notifications, in-app).",
            "difficulty": "senior",
            "required_skills": ["Message Queues", "Real-time Systems", "Scalability", "Event Processing"],
            "time_limit_minutes": 60,
            "architecture_focus": ["Latency", "Throughput", "Reliability", "Scalability"],
            "evaluation_metrics": {
                "Throughput": "1M notifications/second",
                "End-to-end latency": "< 1 second p99",
                "Delivery guarantee": "At least once"
            },
            "diagram_requirements": [
                "System architecture with message queues",
                "Notification flow diagram",
                "Consumer worker architecture"
            ],
            "solution_framework": {
                "title": "Real-time Notification Architecture",
                "overview": "Event-driven architecture with message queues for decoupling and scalability",
                "steps": [
                    "Design notification API endpoints",
                    "Implement message queue (Kafka/RabbitMQ) for event buffering",
                    "Create consumer workers for each notification channel",
                    "Implement retry logic with exponential backoff",
                    "Design notification template system",
                    "Track notification delivery status",
                    "Implement rate limiting per user/channel"
                ],
                "time_complexity": "O(1) enqueue, O(n) processing for n notifications",
                "common_mistakes": [
                    "Synchronous notification sending causing cascading failures",
                    "No retry mechanism leading to lost notifications",
                    "Duplicate notifications without idempotency",
                    "No rate limiting causing spam"
                ],
                "alternative_approaches": [
                    "Pull-based vs push-based delivery",
                    "Batch processing vs real-time",
                    "Webhook notifications"
                ],
                "real_world_correlation": "Companies like Uber, Airbnb use similar notification systems",
                "whiteboard_checklist": [
                    "Clarify notification types and channels",
                    "Define delivery guarantees",
                    "Discuss failure scenarios",
                    "Plan for scale and latency"
                ]
            },
            "follow_up_questions": [
                "How do you prevent duplicate notifications?",
                "How do you handle failed delivery and retries?",
                "How do you prioritize urgent notifications?"
            ]
        },
        "source": "template",
        "tags": ["message-queues", "event-driven", "real-time"]
    },
    {
        "title": "Design a Distributed Rate Limiter",
        "challenge_type": "system_design",
        "difficulty": "senior",
        "required_skills": ["Distributed Systems", "Algorithms", "Data Structures"],
        "time_limit_minutes": 50,
        "system_design": {
            "title": "Design a Distributed Rate Limiter",
            "prompt": "Design a rate limiting system that can enforce rate limits across multiple servers. Support different rate limiting strategies (Token Bucket, Sliding Window).",
            "difficulty": "senior",
            "required_skills": ["Distributed Systems", "Algorithms", "Redis", "Concurrency"],
            "time_limit_minutes": 50,
            "architecture_focus": ["Consistency", "Scalability", "Latency"],
            "evaluation_metrics": {
                "Accuracy": "Zero false positives",
                "Latency": "< 10ms p99",
                "QPS": "100K requests/second"
            },
            "diagram_requirements": [
                "Rate limiter architecture",
                "Data flow diagram"
            ],
            "solution_framework": {
                "title": "Distributed Rate Limiter Design",
                "overview": "Using Redis for shared state across distributed rate limiters",
                "steps": [
                    "Choose rate limiting algorithm (Token Bucket recommended)",
                    "Use Redis for distributed state management",
                    "Implement atomic operations with Lua scripts",
                    "Design sliding window approach for accuracy",
                    "Handle clock skew and synchronization",
                    "Implement fallback strategies for Redis failures"
                ],
                "time_complexity": "O(1) per request with Redis",
                "common_mistakes": [
                    "Using client-side only rate limiting (easy to bypass)",
                    "Not handling distributed scenarios",
                    "Clock skew causing rate limit inaccuracies",
                    "No fallback for cache failures"
                ],
                "alternative_approaches": [
                    "Token Bucket vs Sliding Window vs Leaky Bucket",
                    "Centralized vs Distributed rate limiter",
                    "Local cache with sync vs pure Redis"
                ],
                "real_world_correlation": "Used by AWS, Stripe, GitHub APIs",
                "whiteboard_checklist": [
                    "Define rate limit requirements",
                    "Discuss distribution strategy",
                    "Plan for edge cases and failures",
                    "Consider multi-dimensional limits"
                ]
            },
            "follow_up_questions": [
                "How do you handle different rate limits for different users?",
                "How do you sync rate limits across regions?",
                "What happens if Redis goes down?"
            ]
        },
        "source": "template",
        "tags": ["distributed-systems", "algorithms", "redis"]
    },
    {
        "title": "Design a Video Streaming Service",
        "challenge_type": "system_design",
        "difficulty": "senior",
        "required_skills": ["Streaming", "CDN", "Scalability"],
        "time_limit_minutes": 60,
        "system_design": {
            "title": "Design a Video Streaming Service",
            "prompt": "Design a system like YouTube or Netflix that allows users to upload and stream videos. Consider different video qualities and bitrates.",
            "difficulty": "senior",
            "required_skills": ["Streaming", "CDN", "Scalability", "Data Processing"],
            "time_limit_minutes": 60,
            "architecture_focus": ["Scalability", "Bandwidth", "User Experience"],
            "evaluation_metrics": {
                "Concurrent streams": "Millions",
                "Upload throughput": "100k videos/day",
                "Streaming latency": "< 2 seconds"
            },
            "diagram_requirements": [
                "Upload/processing pipeline",
                "Streaming architecture with CDN",
                "Transcoding workflow"
            ],
            "solution_framework": {
                "title": "Video Streaming Architecture",
                "overview": "Distributed system with transcoding, storage, CDN, and playback optimization",
                "steps": [
                    "Design upload API and storage (S3/blob storage)",
                    "Implement video transcoding pipeline (multiple bitrates)",
                    "Use CDN for global content distribution",
                    "Implement adaptive bitrate streaming (HLS/DASH)",
                    "Design metadata database schema",
                    "Implement streaming service with quality selection"
                ],
                "time_complexity": "Upload: O(file_size), Streaming: O(1)",
                "common_mistakes": [
                    "No transcoding leading to poor user experience",
                    "Not using CDN causing bandwidth bottlenecks",
                    "Synchronous transcoding blocking upload response",
                    "No adaptive bitrate causing buffering"
                ],
                "alternative_approaches": [
                    "Synchronous vs asynchronous transcoding",
                    "HLS vs DASH streaming protocols",
                    "Multiple CDN strategy"
                ],
                "real_world_correlation": "YouTube, Netflix, Twitch all use similar architecture",
                "whiteboard_checklist": [
                    "Clarify video formats and qualities",
                    "Discuss transcoding strategy",
                    "Plan CDN distribution",
                    "Estimate bandwidth and storage"
                ]
            },
            "follow_up_questions": [
                "How do you optimize for different network speeds?",
                "How do you handle video processing queue?",
                "How do you implement resume for failed uploads?"
            ]
        },
        "source": "template",
        "tags": ["streaming", "cdn", "media-processing"]
    },
    {
        "title": "Design a Microservices E-commerce Platform",
        "challenge_type": "system_design",
        "difficulty": "senior",
        "required_skills": ["Microservices", "Distributed Transactions", "Scalability"],
        "time_limit_minutes": 60,
        "system_design": {
            "title": "Design a Microservices E-commerce Platform",
            "prompt": "Design an e-commerce platform (like Amazon) using microservices architecture. Handle order processing, inventory, payment, and shipping.",
            "difficulty": "senior",
            "required_skills": ["Microservices", "Distributed Transactions", "Scalability", "API Design"],
            "time_limit_minutes": 60,
            "architecture_focus": ["Service Independence", "Consistency", "Scalability"],
            "evaluation_metrics": {
                "Order throughput": "10K orders/second",
                "Inventory consistency": "Strong",
                "Payment success rate": "> 99%"
            },
            "diagram_requirements": [
                "Microservices architecture diagram",
                "Order processing flow",
                "Data consistency strategy"
            ],
            "solution_framework": {
                "title": "E-commerce Microservices Architecture",
                "overview": "Service-oriented architecture with event-driven inter-service communication",
                "steps": [
                    "Identify microservices (Product, Order, Payment, Inventory, Shipping)",
                    "Design API contracts for each service",
                    "Implement event-driven communication (Kafka/RabbitMQ)",
                    "Handle distributed transactions using Saga pattern",
                    "Design inventory management with optimistic locking",
                    "Implement payment retry logic",
                    "Design service discovery and load balancing"
                ],
                "time_complexity": "Varies by operation",
                "common_mistakes": [
                    "Tight coupling between services",
                    "Synchronous communication causing cascading failures",
                    "Not handling service failures/timeouts",
                    "Duplicate order processing without idempotency",
                    "No compensation logic for failed transactions"
                ],
                "alternative_approaches": [
                    "Saga pattern (choreography vs orchestration)",
                    "Event sourcing for order history",
                    "CQRS for read-heavy inventory views"
                ],
                "real_world_correlation": "Amazon, eBay, Shopify use microservices",
                "whiteboard_checklist": [
                    "Define service boundaries",
                    "Plan inter-service communication",
                    "Design failure recovery",
                    "Address data consistency"
                ]
            },
            "follow_up_questions": [
                "How do you maintain inventory consistency?",
                "How do you handle payment failures?",
                "How do you implement distributed transactions?"
            ]
        },
        "source": "template",
        "tags": ["microservices", "distributed-systems", "event-driven"]
    }
]

# Case study templates - Consulting and Business Roles
CASE_STUDY_TEMPLATES = [
    {
        "title": "Market Sizing: Streaming Service Growth",
        "challenge_type": "case_study",
        "difficulty": "medium",
        "industry": "Technology",
        "case_study": {
            "title": "Market Sizing: Streaming Service Growth",
            "scenario": "A new streaming service wants to understand the potential market opportunity in the US",
            "industry": "Technology/Media",
            "company_size": "Startup",
            "problem_statement": "Estimate the revenue potential for a streaming service in the US market over 5 years",
            "constraints": [
                "Initial budget: $50M",
                "Team size: 50 people",
                "Target: <$20/month subscription"
            ],
            "data_provided": {
                "us_population": 330000000,
                "internet_penetration": 0.88,
                "current_streaming_adoption": 0.65,
                "avg_household_income": 70000,
                "churn_rate_industry_avg": 0.05
            },
            "questions": [
                "Estimate the addressable market size",
                "Project subscriber growth over 5 years",
                "Calculate revenue and profitability",
                "Identify key assumptions and risks"
            ],
            "evaluation_criteria": [
                "Logical thinking",
                "Use of data and assumptions",
                "Business acumen",
                "Communication clarity"
            ]
        },
        "source": "template",
        "tags": ["market-sizing", "business-strategy"]
    },
    {
        "title": "Operational Efficiency: Retail Store Optimization",
        "challenge_type": "case_study",
        "difficulty": "medium",
        "industry": "Retail",
        "case_study": {
            "title": "Operational Efficiency: Retail Store Optimization",
            "scenario": "A major retail chain is experiencing declining sales and wants to optimize store operations",
            "industry": "Retail",
            "company_size": "Enterprise (5000+ stores)",
            "problem_statement": "How would you increase store profitability by 20% within 12 months while maintaining customer satisfaction?",
            "constraints": [
                "Limited capital expenditure budget",
                "Must maintain current workforce",
                "No major supply chain changes allowed"
            ],
            "data_provided": {
                "average_store_sales_per_year": 5000000,
                "labor_cost_percentage": 0.25,
                "inventory_turnover": 6,
                "customer_satisfaction_score": 75,
                "average_transaction_value": 45
            },
            "questions": [
                "Identify 3-4 areas for operational improvement",
                "Quantify potential savings/revenue improvements",
                "Prioritize initiatives by impact and feasibility",
                "Outline implementation timeline and risks"
            ],
            "evaluation_criteria": [
                "Financial acumen",
                "Structured problem solving",
                "Business insight",
                "Practical implementation thinking"
            ]
        },
        "source": "template",
        "tags": ["operations", "business-strategy", "efficiency"]
    },
    {
        "title": "Business Strategy: Market Entry",
        "challenge_type": "case_study",
        "difficulty": "hard",
        "industry": "Strategy",
        "case_study": {
            "title": "Business Strategy: Market Entry for SaaS Product",
            "scenario": "A successful SaaS company in the US wants to expand to European markets",
            "industry": "Software/SaaS",
            "company_size": "Mid-market (500 employees)",
            "problem_statement": "Develop a go-to-market strategy for entering 3 major European markets. Budget: $10M. Timeline: 18 months.",
            "constraints": [
                "Limited local partnerships",
                "Regulatory complexity (GDPR, etc)",
                "Different buyer behaviors",
                "Currency and payment complexities"
            ],
            "data_provided": {
                "current_annual_revenue": 50000000,
                "us_customer_base": 2000,
                "average_customer_value": 25000,
                "churn_rate": 0.08,
                "growth_rate": 0.35
            },
            "questions": [
                "Which 3 European markets should we prioritize and why?",
                "What's the revenue potential in each market over 3 years?",
                "Should we build a local sales team or use partners?",
                "How do we handle regulatory and localization challenges?"
            ],
            "evaluation_criteria": [
                "Strategic thinking",
                "Market understanding",
                "Risk analysis",
                "Execution planning"
            ]
        },
        "source": "template",
        "tags": ["market-entry", "strategy", "international-business"]
    },
    {
        "title": "Investment Decision: Acquisition Analysis",
        "challenge_type": "case_study",
        "difficulty": "hard",
        "industry": "Finance",
        "case_study": {
            "title": "Investment Decision: Company Acquisition Analysis",
            "scenario": "Your company is considering acquiring a competitor. Finance team wants your perspective on whether it's a good deal.",
            "industry": "Any/General",
            "company_size": "Enterprise",
            "problem_statement": "Evaluate the acquisition of Company X for $500M. Recommended maximum price?",
            "constraints": [
                "Due diligence in 30 days",
                "Market pressures (competitor making same bid)",
                "Integration complexity",
                "Regulatory approval uncertainty"
            ],
            "data_provided": {
                "target_annual_revenue": 100000000,
                "target_ebitda_margin": 0.30,
                "growth_rate": 0.20,
                "acquirer_revenue": 500000000,
                "acquirer_ebitda_margin": 0.35,
                "synergy_estimates": 50000000
            },
            "questions": [
                "Calculate a valuation range using multiple methods",
                "Estimate integration costs and timeline",
                "Identify key synergies and risks",
                "Recommend maximum acceptable price and payment structure"
            ],
            "evaluation_criteria": [
                "Financial modeling",
                "Strategic vision",
                "Risk assessment",
                "Deal structuring knowledge"
            ]
        },
        "source": "template",
        "tags": ["finance", "m-and-a", "investment"]
    }
]


# Job role to challenge mapping for targeted interview prep
JOB_ROLE_MAPPINGS = {
    "software_engineer": {
        "coding_skills": ["Arrays", "Hash Maps", "Strings", "Linked Lists", "Trees"],
        "challenge_types": ["coding"],
        "difficulties": ["easy", "medium"],
        "description": "Focus on core data structures and algorithms"
    },
    "senior_software_engineer": {
        "coding_skills": ["Trees", "Graphs", "Dynamic Programming", "Design"],
        "system_design_focus": ["Scalability", "Availability", "Consistency"],
        "challenge_types": ["coding", "system_design"],
        "difficulties": ["medium", "hard"],
        "description": "Advanced algorithms and system design"
    },
    "frontend_engineer": {
        "coding_skills": ["JavaScript", "React", "Design Patterns", "Browser APIs"],
        "challenge_types": ["coding"],
        "difficulties": ["easy", "medium"],
        "description": "Front-end specific algorithms and optimization"
    },
    "backend_engineer": {
        "coding_skills": ["Database Design", "APIs", "Concurrency", "Distributed Systems"],
        "system_design_focus": ["Scalability", "Performance", "Reliability"],
        "challenge_types": ["coding", "system_design"],
        "difficulties": ["medium", "hard"],
        "description": "Backend systems, databases, and distributed computing"
    },
    "data_engineer": {
        "coding_skills": ["SQL", "Data Processing", "ETL", "Distributed Systems"],
        "system_design_focus": ["Data Pipeline", "Scalability", "Reliability"],
        "challenge_types": ["coding", "system_design"],
        "difficulties": ["medium", "hard"],
        "description": "Data pipeline design and optimization"
    },
    "ml_engineer": {
        "coding_skills": ["Python", "Statistics", "Machine Learning", "Data Structures"],
        "challenge_types": ["coding", "case_study"],
        "difficulties": ["medium", "hard"],
        "description": "Machine learning algorithms and data handling"
    },
    "product_manager": {
        "challenge_types": ["case_study", "system_design"],
        "difficulties": ["medium", "hard"],
        "description": "Product strategy, market analysis, and business thinking"
    },
    "management_consultant": {
        "challenge_types": ["case_study"],
        "difficulties": ["hard"],
        "description": "Business strategy, operations, and financial analysis"
    }
}


class TechnicalPrepService:
    """Service for generating and managing technical interview preparation"""

    async def get_recommended_challenges(
        self,
        uuid: str,
        job_role: Optional[str] = None,
        user_skills: Optional[List[str]] = None,
        difficulty: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recommended challenges based on user profile"""
        challenges = []

        # Try to fetch from database first
        if job_role:
            db_challenges = await technical_prep_dao.get_challenges_by_role(job_role, limit=limit)
            challenges.extend(db_challenges)

        if user_skills:
            skill_challenges = await technical_prep_dao.get_challenges_by_skills(user_skills, limit=limit)
            challenges.extend(skill_challenges)

        # Remove duplicates
        seen_ids = set()
        unique_challenges = []
        for c in challenges:
            cid = c.get("_id")
            if cid not in seen_ids:
                seen_ids.add(cid)
                unique_challenges.append(c)

        return unique_challenges[:limit]

    async def get_job_role_recommendations(
        self,
        uuid: str,
        job_role: str,
        limit: int = 15
    ) -> Dict[str, Any]:
        """Get personalized challenge recommendations based on job role"""
        if job_role not in JOB_ROLE_MAPPINGS:
            return {
                "error": f"Unknown job role: {job_role}",
                "available_roles": list(JOB_ROLE_MAPPINGS.keys())
            }

        role_config = JOB_ROLE_MAPPINGS[job_role]
        challenges = {
            "coding": [],
            "system_design": [],
            "case_study": []
        }

        # Get challenges for each allowed type
        for challenge_type in role_config.get("challenge_types", []):
            try:
                if challenge_type == "coding":
                    # Get challenges with recommended difficulties
                    for difficulty in role_config.get("difficulties", ["medium"]):
                        type_challenges = await technical_prep_dao.get_challenges_by_difficulty(
                            difficulty, limit=5
                        )
                        challenges["coding"].extend(type_challenges)
                else:
                    # For system_design and case_study
                    type_challenges = await technical_prep_dao.get_challenges_by_type(
                        challenge_type, limit=10
                    )
                    challenges[challenge_type].extend(type_challenges)
            except Exception as e:
                print(f"Error fetching {challenge_type} challenges: {e}")

        return {
            "success": True,
            "job_role": job_role,
            "role_description": role_config.get("description"),
            "recommended_skills": role_config.get("coding_skills", []),
            "challenges": challenges,
            "total_challenges": sum(len(v) for v in challenges.values())
        }

    async def get_job_based_recommendations(
        self,
        uuid: str,
        job_id: str,
        job_title: str,
        job_description: str,
        limit: int = 15
    ) -> Dict[str, Any]:
        """Get personalized challenge recommendations based on actual job application details"""
        challenges = {
            "coding": [],
            "system_design": [],
            "case_study": []
        }

        try:
            # Extract key skills from job title and description
            job_title_lower = job_title.lower() if job_title else ""
            job_desc_lower = job_description.lower() if job_description else ""
            combined_text = f"{job_title_lower} {job_desc_lower}".lower()

            # Determine challenge types based on job title/description
            is_senior = any(word in job_title_lower for word in ["senior", "lead", "principal", "staff", "architect"])
            is_backend = any(word in combined_text for word in ["backend", "api", "database", "server", "microservice"])
            is_frontend = any(word in combined_text for word in ["frontend", "react", "javascript", "ui", "ux", "web"])
            is_ml = any(word in combined_text for word in ["machine learning", "ml", "data science", "ai", "neural", "nlp"])
            is_product = any(word in combined_text for word in ["product manager", "pm", "product", "strategy"])
            is_data = any(word in combined_text for word in ["data engineer", "data", "etl", "pipeline", "warehouse"])

            # Get relevant challenges based on role
            difficulties = ["hard"] if is_senior else ["medium", "hard"]

            # Coding challenges (everyone needs these)
            for difficulty in difficulties:
                coding_challenges = await technical_prep_dao.get_challenges_by_difficulty(
                    difficulty, limit=5
                )
                challenges["coding"].extend(coding_challenges)

            # System design challenges (for senior and backend roles)
            if is_senior or is_backend or is_data:
                design_challenges = await technical_prep_dao.get_challenges_by_type(
                    "system_design", limit=5
                )
                challenges["system_design"].extend(design_challenges)

            # Case studies (for product managers and senior roles)
            if is_product or is_senior:
                case_studies = await technical_prep_dao.get_challenges_by_type(
                    "case_study", limit=3
                )
                challenges["case_study"].extend(case_studies)

            # Determine recommended skills based on job
            recommended_skills = []
            if is_backend:
                recommended_skills.extend(["Database Design", "API Design", "Scalability", "Distributed Systems"])
            if is_frontend:
                recommended_skills.extend(["JavaScript", "React", "DOM", "Performance Optimization"])
            if is_data:
                recommended_skills.extend(["SQL", "Data Pipeline", "ETL", "Data Modeling"])
            if is_ml:
                recommended_skills.extend(["Python", "Machine Learning", "Statistics", "Data Processing"])
            if is_product:
                recommended_skills.extend(["Market Analysis", "Business Strategy", "User Research"])

            return {
                "success": True,
                "job_id": job_id,
                "job_title": job_title,
                "challenges": challenges,
                "recommended_skills": recommended_skills,
                "total_challenges": sum(len(v) for v in challenges.values()),
                "role_analysis": {
                    "is_senior": is_senior,
                    "is_backend": is_backend,
                    "is_frontend": is_frontend,
                    "is_ml": is_ml,
                    "is_product": is_product,
                    "is_data": is_data
                }
            }

        except Exception as e:
            print(f"Error getting job-based recommendations: {e}")
            return {
                "success": False,
                "error": f"Failed to generate recommendations: {str(e)}"
            }

    async def generate_coding_challenge(
        self,
        uuid: str,
        difficulty: str = "medium",
        skills: Optional[List[str]] = None,
        job_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate or fetch a coding challenge"""
        # Try to fetch from database first
        db_challenges = await technical_prep_dao.get_challenges_by_difficulty(difficulty, limit=50)

        if db_challenges:
            # Filter by skills if provided
            if skills:
                filtered = [
                    c for c in db_challenges
                    if any(skill in c.get("required_skills", []) for skill in skills)
                ]
                db_challenges = filtered if filtered else db_challenges

            # Randomly select instead of always picking first
            selected = random.choice(db_challenges)
            # Remove _id so it can be re-inserted as a new document
            selected.pop("_id", None)
            return selected

        # Fallback to templates if no database challenges found
        templates = [c for c in CODING_CHALLENGES_TEMPLATES if c.get("difficulty") == difficulty]

        if skills:
            filtered = [
                c for c in templates
                if any(skill in c.get("required_skills", []) for skill in skills)
            ]
            templates = filtered if filtered else templates

        if not templates:
            templates = CODING_CHALLENGES_TEMPLATES

        # Randomly select from available templates
        template = random.choice(templates)
        challenge_data = {
            "uuid": uuid,
            "challenge_type": "coding",
            "title": template.get("title"),
            "description": template.get("description"),
            "difficulty": template.get("difficulty"),
            "job_role": job_role,
            "required_skills": template.get("required_skills", []),
            "required_tech_stack": template.get("required_languages", []),
            "time_limit_minutes": template.get("time_limit_minutes"),
            "coding_challenge": template.get("coding_challenge"),
            "source": "template",
            "ai_generated": False,
            "tags": template.get("tags", []),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        return challenge_data

    async def generate_system_design_challenge(
        self,
        uuid: str,
        seniority: str = "senior",
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Generate or fetch a system design challenge"""
        # Try to fetch from database first
        db_challenges = await technical_prep_dao.get_challenges_by_type("system_design", limit=50)

        if db_challenges:
            # Randomly select instead of always picking first
            selected = random.choice(db_challenges)
            # Remove _id so it can be re-inserted as a new document
            selected.pop("_id", None)
            return selected

        # Fallback to templates if no database challenges found
        template = random.choice(SYSTEM_DESIGN_TEMPLATES) if SYSTEM_DESIGN_TEMPLATES else SYSTEM_DESIGN_TEMPLATES[0]

        challenge_data = {
            "uuid": uuid,
            "challenge_type": "system_design",
            "title": template.get("title"),
            "description": template.get("system_design", {}).get("prompt"),
            "difficulty": seniority,
            "required_skills": template.get("required_skills", []),
            "time_limit_minutes": template.get("time_limit_minutes"),
            "system_design": template.get("system_design"),
            "source": "template",
            "ai_generated": False,
            "tags": template.get("tags", []),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        return challenge_data

    async def generate_case_study(
        self,
        uuid: str,
        industry: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate or fetch a case study"""
        # Try to fetch from database first
        db_challenges = await technical_prep_dao.get_challenges_by_type("case_study", limit=50)

        if db_challenges:
            # Randomly select instead of always picking first
            selected = random.choice(db_challenges)
            # Remove _id so it can be re-inserted as a new document
            selected.pop("_id", None)
            return selected

        # Fallback to templates if no database challenges found
        template = random.choice(CASE_STUDY_TEMPLATES) if CASE_STUDY_TEMPLATES else CASE_STUDY_TEMPLATES[0]

        challenge_data = {
            "uuid": uuid,
            "challenge_type": "case_study",
            "title": template.get("title"),
            "description": template.get("case_study", {}).get("problem_statement"),
            "difficulty": "medium",
            "industry": industry or template.get("industry"),
            "case_study": template.get("case_study"),
            "source": "template",
            "ai_generated": False,
            "tags": template.get("tags", []),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        return challenge_data

    async def start_challenge_attempt(
        self,
        uuid: str,
        challenge_id: str
    ) -> str:
        """Start a new challenge attempt"""
        attempt_data = {
            "uuid": uuid,
            "challenge_id": challenge_id,
            "start_time": datetime.now(timezone.utc),
            "attempts": 0,
            "status": "in_progress",
            "test_results": [],
            "improvement_trend": []
        }

        # Get challenge to populate challenge_type
        challenge = await technical_prep_dao.get_challenge(challenge_id)
        if challenge:
            attempt_data["challenge_type"] = challenge.get("challenge_type", "unknown")

        return await technical_prep_dao.create_attempt(attempt_data)

    async def submit_challenge_code(
        self,
        attempt_id: str,
        code: str,
        language: str
    ) -> Dict[str, Any]:
        """Submit code for a challenge"""
        print(f"[SUBMIT] Starting code submission for attempt: {attempt_id}")

        attempt = await technical_prep_dao.get_attempt(attempt_id)
        if not attempt:
            print(f"[SUBMIT] Attempt not found: {attempt_id}")
            return {"success": False, "error": "Attempt not found"}

        print(f"[SUBMIT] Attempt found, challenge_id: {attempt.get('challenge_id')}")

        # Get challenge
        challenge = await technical_prep_dao.get_challenge(attempt["challenge_id"])
        if not challenge:
            print(f"[SUBMIT] Challenge not found: {attempt['challenge_id']}")
            return {"success": False, "error": "Challenge not found"}

        print(f"[SUBMIT] Challenge found: {challenge.get('title')}")

        # Always generate test cases for coding challenges
        if challenge.get("challenge_type") == "coding":
            coding = challenge.get("coding_challenge", {})
            # Generate fresh AI test cases
            test_cases = await self._generate_test_cases(challenge, language)
            print(f"[SUBMIT] Generated {len(test_cases)} test cases: {test_cases}")
            # Update challenge with generated test cases
            if test_cases:
                coding["test_cases"] = test_cases
                challenge["coding_challenge"] = coding
                print(f"[SUBMIT] Updated challenge coding_challenge with test_cases")

        # Run tests
        test_results = await self._run_tests(challenge, code, language)
        print(f"[SUBMIT] Got {len(test_results)} test results")
        if test_results:
            print(f"[SUBMIT] First result: {test_results[0]}")

        passed = sum(1 for t in test_results if t.get("passed"))
        total = len(test_results)
        score = (passed / total * 100) if total > 0 else 0

        # Update attempt
        update_data = {
            "user_code": code,
            "language": language,
            "test_results": test_results,
            "passed_tests": passed,
            "total_tests": total,
            "failed_tests": total - passed,
            "attempts": attempt.get("attempts", 0) + 1,
            "score": score
        }

        await technical_prep_dao.update_attempt(attempt_id, update_data)

        response_data = {
            "success": True,
            "passed": passed,
            "total": total,
            "score": score,
            "test_results": test_results
        }
        print(f"[SUBMIT] Returning response: {response_data}")
        return response_data

    async def complete_challenge(
        self,
        attempt_id: str,
        score: float,
        passed_tests: int,
        total_tests: int,
        code: Optional[str] = None
    ) -> bool:
        """Mark a challenge attempt as complete"""
        return await technical_prep_dao.complete_attempt(
            attempt_id, score, passed_tests, total_tests, code
        )

    async def _generate_test_cases(self, challenge: Dict[str, Any], language: str) -> List[Dict[str, Any]]:
        """Generate 3 test cases for a coding challenge using OpenAI"""
        try:
            coding = challenge.get("coding_challenge", {})
            title = challenge.get("title", "Test Challenge")
            description = coding.get("description", "No description provided")

            # Ensure we have content to work with
            if not title or not description:
                return self._get_fallback_test_cases()

            # Create prompt for OpenAI to generate test cases
            prompt = f"""Generate exactly 3 test cases for this coding problem. Return ONLY a valid JSON array, no markdown, no explanation.

[
  {{"input": {{"param1": value, "param2": value}}, "expected_output": expected_value, "description": "Test case 1"}},
  {{"input": {{"param1": value, "param2": value}}, "expected_output": expected_value, "description": "Test case 2"}},
  {{"input": {{"param1": value, "param2": value}}, "expected_output": expected_value, "description": "Test case 3"}}
]

PROBLEM: {title}
DESCRIPTION: {description}

Create 3 test cases:
1. Simple/basic case
2. Medium complexity/edge case
3. Complex/boundary case

Return ONLY the JSON array, nothing else."""

            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a code testing expert. Return ONLY valid JSON, no other text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.7,
            )

            response_text = response.choices[0].message.content.strip()

            # Clean up response - remove markdown code blocks if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            # Parse JSON response
            test_cases = json.loads(response_text)

            # Validate and return test cases
            if isinstance(test_cases, list) and len(test_cases) > 0:
                validated_cases = []
                for tc in test_cases:
                    if isinstance(tc, dict) and "input" in tc and "expected_output" in tc:
                        validated_cases.append({
                            "input": tc.get("input", {}),
                            "expected_output": tc.get("expected_output"),
                            "description": tc.get("description", "Test case")
                        })

                if validated_cases:
                    return validated_cases

            # If parsing succeeded but no valid cases, return fallback
            return self._get_fallback_test_cases()

        except json.JSONDecodeError as e:
            print(f"Test case generation - JSON error: {str(e)}")
            return self._get_fallback_test_cases()
        except Exception as e:
            print(f"Test case generation error: {str(e)}")
            return self._get_fallback_test_cases()

    def _get_fallback_test_cases(self) -> List[Dict[str, Any]]:
        """Return fallback test cases when generation fails"""
        return [
            {
                "input": {"nums": [1, 2, 3], "target": 5},
                "expected_output": [1, 2],
                "description": "Basic test case"
            },
            {
                "input": {"nums": [2, 7, 11, 15], "target": 9},
                "expected_output": [0, 1],
                "description": "Medium test case"
            },
            {
                "input": {"nums": [3, 2, 4], "target": 6},
                "expected_output": [1, 2],
                "description": "Edge case"
            }
        ]

    async def _run_tests(self, challenge: Dict[str, Any], code: str, language: str) -> List[Dict[str, Any]]:
        """Run tests against submitted code using OpenAI"""
        test_cases = []

        if challenge.get("challenge_type") == "coding":
            coding = challenge.get("coding_challenge", {})
            test_cases = coding.get("test_cases", [])

        # Run tests
        results = []
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        rate_limited = False

        for i, test in enumerate(test_cases):
            try:
                # If we hit rate limit, mark remaining tests as skipped
                if rate_limited:
                    results.append({
                        "test_number": i + 1,
                        "input": test.get("input", {}),
                        "expected": test.get("expected_output"),
                        "actual": "Skipped due to API rate limit",
                        "passed": False,
                        "description": test.get("description", f"Test {i + 1}")
                    })
                    continue

                test_input = test.get("input", {})
                expected_output = test.get("expected_output")

                # Create prompt to execute code
                execution_prompt = self._create_execution_prompt(code, language, test_input)

                # Call OpenAI to execute code
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a code execution assistant. Execute the provided code with the given inputs and return ONLY the output value, nothing else."
                        },
                        {
                            "role": "user",
                            "content": execution_prompt
                        }
                    ],
                    max_tokens=500,
                    temperature=0,
                )

                actual_output_text = response.choices[0].message.content.strip()

                # Try to parse and compare output
                passed = self._compare_outputs(actual_output_text, expected_output, language)

                results.append({
                    "test_number": i + 1,
                    "input": test_input,
                    "expected": expected_output,
                    "actual": actual_output_text,
                    "passed": passed,
                    "description": test.get("description", f"Test {i + 1}")
                })
            except Exception as e:
                error_str = str(e)
                # Check if it's a rate limit error
                if "429" in error_str or "rate_limit_exceeded" in error_str or "RateLimitError" in error_str:
                    rate_limited = True
                    error_msg = "API rate limit reached. Unable to execute remaining tests."
                else:
                    error_msg = f"Execution error: {error_str[:100]}"

                results.append({
                    "test_number": i + 1,
                    "input": test.get("input", {}),
                    "expected": test.get("expected_output"),
                    "actual": error_msg,
                    "passed": False,
                    "description": test.get("description", f"Test {i + 1}")
                })

        return results

    def _create_execution_prompt(self, code: str, language: str, test_input: Dict[str, Any]) -> str:
        """Create a prompt for OpenAI to execute code"""
        # Convert test input to function arguments
        if isinstance(test_input, dict):
            args_str = ", ".join([f"{k}={json.dumps(v)}" for k, v in test_input.items()])
        else:
            args_str = str(test_input)

        prompt = f"""Execute this {language.capitalize()} code and return ONLY the output value (no explanation):

{code}

Call the function with these inputs: {args_str}

Output:"""
        return prompt

    def _compare_outputs(self, actual: str, expected: Any, language: str) -> bool:
        """Compare actual output with expected output"""
        try:
            # Try to parse actual output as JSON if expected is complex type
            if isinstance(expected, (list, dict)):
                try:
                    actual_parsed = json.loads(actual)
                    return actual_parsed == expected
                except:
                    # If JSON parse fails, try string comparison
                    return str(actual).strip() == str(expected).strip()
            else:
                # For simple types, compare as strings
                return str(actual).strip() == str(expected).strip()
        except:
            return False

    async def get_user_progress(self, uuid: str) -> Dict[str, Any]:
        """Get user's technical prep progress"""
        stats = await technical_prep_dao.get_user_statistics(uuid)
        return stats

    async def get_challenge_leaderboard(self, challenge_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get leaderboard for a challenge"""
        attempts = await technical_prep_dao.get_challenge_attempts(challenge_id)

        # Group by user and get best score
        user_scores = {}
        for attempt in attempts:
            uuid = attempt.get("uuid")
            score = attempt.get("score", 0)
            if uuid not in user_scores or score > user_scores[uuid]:
                user_scores[uuid] = score

        # Sort and return
        leaderboard = [
            {"uuid": u, "score": s}
            for u, s in sorted(user_scores.items(), key=lambda x: x[1], reverse=True)
        ]

        return leaderboard[:limit]

    async def generate_solution(self, challenge_id: str, language: str = "python") -> Dict[str, Any]:
        """Generate a solution for a challenge using Cohere"""
        try:
            # Get challenge
            challenge = await technical_prep_dao.get_challenge(challenge_id)
            if not challenge:
                return {"success": False, "error": "Challenge not found"}

            # Get the title and description
            title = challenge.get("title", "")
            description = challenge.get("description", "")

            # Get more details from coding_challenge if available
            coding = challenge.get("coding_challenge", {})
            example_input = coding.get("example_input", "")
            example_output = coding.get("example_output", "")
            solution_framework = coding.get("solution_framework", {})

            # Create prompt for Cohere
            prompt = f"""Generate a clean, well-commented {language.capitalize()} solution for this coding problem:

Problem: {title}

Description:
{description}

{f'Example Input: {example_input}' if example_input else ''}
{f'Example Output: {example_output}' if example_output else ''}

Requirements:
- Provide a complete, working solution
- Include helpful comments explaining the approach
- Make the code efficient and readable
- The function signature should match the problem requirements
- Return only the code solution without explanations

Solution:"""

            # Call OpenAI API with error handling
            try:
                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert programming instructor. Provide clean, well-commented code solutions."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=1000,
                    temperature=0.7,
                )

                solution_code = response.choices[0].message.content.strip()
                return {
                    "success": True,
                    "language": language,
                    "solution": solution_code,
                    "title": title
                }

            except Exception as openai_error:
                # If OpenAI API fails (rate limit, etc), try template solution first
                solution_code = solution_framework.get("solution_code", {}).get(language)
                if solution_code:
                    return {
                        "success": True,
                        "language": language,
                        "solution": solution_code,
                        "title": title,
                        "note": "Using template solution (OpenAI API temporarily unavailable)"
                    }

                # If no template solution code, return approach as fallback
                if solution_framework.get("steps"):
                    steps_text = "\n".join([f"{i+1}. {step}" for i, step in enumerate(solution_framework.get("steps", []))])
                    pseudocode = solution_framework.get("pseudocode", "")
                    fallback_solution = f"""# Solution Approach:\n{steps_text}\n\n# Pseudocode:\n{pseudocode}"""
                    return {
                        "success": True,
                        "language": language,
                        "solution": fallback_solution,
                        "title": title,
                        "note": "Showing approach steps (OpenAI API unavailable - see approach tab for detailed solution)"
                    }

                # Last resort: return error with helpful message
                return {
                    "success": False,
                    "error": "Solution generation temporarily unavailable due to API rate limits. Please try again later or visit the approach section in the Solution tab.",
                    "title": title
                }

        except Exception as e:
            import traceback
            print(f"Solution generation error: {traceback.format_exc()}")
            return {
                "success": False,
                "error": f"Failed to generate solution: {str(e)}"
            }


# Export singleton
technical_prep_service = TechnicalPrepService()
