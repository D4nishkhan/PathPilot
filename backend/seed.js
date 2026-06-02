require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Track, Module, Topic } = require('./src/models/Track');
const Video = require('./src/models/Video');
const Note = require('./src/models/Note');
const { Quiz } = require('./src/models/Quiz');
const { Badge } = require('./src/models/Badge');
const User = require('./src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pathpilot';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB Connected');

  // Clean existing seeded data
  await Track.deleteMany({});
  await Module.deleteMany({});
  await Topic.deleteMany({});
  await Video.deleteMany({});
  await Note.deleteMany({});
  await Quiz.deleteMany({});
  await Badge.deleteMany({});
  console.log('🧹 Cleared old seed data');

  // ─── Badges ─────────────────────────────────────
  const badges = await Badge.insertMany([
    { name: 'First Step', slug: 'first-step', description: 'Complete your first video', icon: '🚀', rarity: 'common', condition: { type: 'videos', threshold: 1 }, xpReward: 50 },
    { name: 'Streak Starter', slug: 'streak-starter', description: '3 day study streak', icon: '🔥', rarity: 'common', condition: { type: 'streak', threshold: 3 }, xpReward: 100 },
    { name: 'Quiz Master', slug: 'quiz-master', description: 'Pass 5 quizzes', icon: '🧠', rarity: 'rare', condition: { type: 'quizzes', threshold: 5 }, xpReward: 200 },
    { name: 'Week Warrior', slug: 'week-warrior', description: '7 day study streak', icon: '⚡', rarity: 'rare', condition: { type: 'streak', threshold: 7 }, xpReward: 300 },
    { name: 'XP Legend', slug: 'xp-legend', description: 'Earn 1000 XP', icon: '👑', rarity: 'epic', condition: { type: 'xp', threshold: 1000 }, xpReward: 500 },
    { name: 'Architect', slug: 'architect', description: 'Reach Level 9', icon: '🏗️', rarity: 'legendary', condition: { type: 'level', threshold: 9 }, xpReward: 1000 },
  ]);
  console.log(`✅ Created ${badges.length} badges`);

  // ─── Track 1: Java Backend ────────────────────────
  const javaTrack = await Track.create({
    title: 'Java Backend Development',
    slug: 'java-backend',
    description: 'Master Java backend development from fundamentals to advanced Spring Boot applications. Learn OOP, data structures, REST APIs, JPA, and deployment.',
    shortDescription: 'From Java basics to production-ready Spring Boot apps',
    category: 'backend',
    difficulty: 'beginner',
    estimatedHours: 80,
    tags: ['java', 'spring-boot', 'backend', 'rest-api', 'jpa'],
    isPublished: true,
    isPremium: false,
    order: 1,
    rating: 4.8,
    enrolledCount: 1240,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/en/3/30/Java_programming_language_logo.svg',
  });

  const javaModule1 = await Module.create({ trackId: javaTrack._id, title: 'Java Fundamentals', description: 'Core Java concepts and OOP principles', order: 1, estimatedHours: 15 });
  const javaModule2 = await Module.create({ trackId: javaTrack._id, title: 'Collections & Generics', description: 'Java Collections Framework and Generics', order: 2, estimatedHours: 12 });
  const javaModule3 = await Module.create({ trackId: javaTrack._id, title: 'Spring Boot REST APIs', description: 'Build REST APIs with Spring Boot', order: 3, estimatedHours: 20 });

  // Topics for Module 1
  const vid1 = await Video.create({ youtubeId: 'eIrMbAQSU34', title: 'Java Complete Course', duration: 9*3600, thumbnailUrl: 'https://i.ytimg.com/vi/eIrMbAQSU34/hqdefault.jpg' });
  const note1 = await Note.create({
    topicId: new mongoose.Types.ObjectId(),
    title: 'Java OOP Concepts Cheatsheet',
    content: '# Java OOP Fundamentals\n\n## 4 Pillars of OOP\n\n### 1. Encapsulation\nHiding implementation details using access modifiers.\n\n```java\npublic class BankAccount {\n    private double balance; // hidden\n    \n    public double getBalance() { return balance; } // exposed\n    public void deposit(double amount) {\n        if (amount > 0) balance += amount;\n    }\n}\n```\n\n### 2. Inheritance\nChild class inherits parent properties.\n\n```java\nclass Animal {\n    String name;\n    void speak() { System.out.println("..."); }\n}\n\nclass Dog extends Animal {\n    @Override\n    void speak() { System.out.println("Woof!"); }\n}\n```\n\n### 3. Polymorphism\nSame interface, different implementations.\n\n### 4. Abstraction\nHide complexity using abstract classes and interfaces.',
    cheatsheet: '| Concept | Keyword | Purpose |\n|---------|---------|----------|\n| Encapsulation | private/public | Data hiding |\n| Inheritance | extends | Code reuse |\n| Polymorphism | @Override | Flexibility |\n| Abstraction | abstract/interface | Simplification |',
    keyPoints: ['Encapsulation hides internal state', 'Inheritance promotes code reuse', 'Polymorphism enables flexible design', 'Abstraction reduces complexity'],
    estimatedReadTime: 15,
  });
  const quiz1 = await Quiz.create({
    topicId: new mongoose.Types.ObjectId(),
    title: 'Java OOP Fundamentals Quiz',
    description: 'Test your understanding of Java OOP concepts',
    passingScore: 70,
    xpReward: 30,
    questions: [
      {
        type: 'mcq',
        question: 'Which OOP concept is demonstrated when a subclass provides its own implementation of a parent class method?',
        options: [
          { text: 'Encapsulation', isCorrect: false },
          { text: 'Polymorphism', isCorrect: true, explanation: 'Method overriding is a form of runtime polymorphism' },
          { text: 'Abstraction', isCorrect: false },
          { text: 'Inheritance', isCorrect: false },
        ],
        explanation: 'Method overriding is runtime polymorphism — the correct method is determined at runtime based on the actual object type.',
        difficulty: 'medium',
        points: 10,
      },
      {
        type: 'mcq',
        question: 'What access modifier makes a variable accessible only within its own class?',
        options: [
          { text: 'public', isCorrect: false },
          { text: 'protected', isCorrect: false },
          { text: 'private', isCorrect: true, explanation: 'private restricts access to the declaring class only' },
          { text: 'default', isCorrect: false },
        ],
        explanation: 'The private modifier is the most restrictive, allowing access only within the declaring class itself.',
        difficulty: 'easy',
        points: 10,
      },
      {
        type: 'trueFalse',
        question: 'In Java, a class can extend multiple classes (multiple inheritance is supported)',
        options: [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: true, explanation: 'Java does not support multiple class inheritance. Use interfaces instead.' },
        ],
        explanation: 'Java does not support multiple inheritance with classes to avoid the Diamond Problem. You can implement multiple interfaces though.',
        difficulty: 'easy',
        points: 10,
      },
      {
        type: 'codeOutput',
        question: 'What will this code output?',
        code: 'class Animal {\n    String sound = "...";\n    void speak() { System.out.println(sound); }\n}\nclass Cat extends Animal {\n    String sound = "Meow";\n    void speak() { System.out.println(sound); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Animal a = new Cat();\n        a.speak();\n    }\n}',
        language: 'java',
        options: [
          { text: '...', isCorrect: false },
          { text: 'Meow', isCorrect: true, explanation: 'Dynamic dispatch calls the overridden speak() in Cat' },
          { text: 'Compilation error', isCorrect: false },
          { text: 'null', isCorrect: false },
        ],
        explanation: 'Due to dynamic dispatch/runtime polymorphism, Cat\'s speak() method is called even though the reference is of type Animal.',
        difficulty: 'hard',
        points: 20,
      },
    ],
  });

  const topic1 = await Topic.create({ moduleId: javaModule1._id, trackId: javaTrack._id, title: 'OOP Concepts in Java', description: 'Learn the 4 pillars of OOP with hands-on Java examples', order: 1, videoId: vid1._id, noteId: note1._id, quizId: quiz1._id, xpReward: 50 });
  // Update noteId and quizId with actual topic
  await Note.findByIdAndUpdate(note1._id, { topicId: topic1._id });
  await Quiz.findByIdAndUpdate(quiz1._id, { topicId: topic1._id });

  const vid2 = await Video.create({ youtubeId: 'kp8bRd4Jh1g', title: 'Java Exception Handling', duration: 3600, thumbnailUrl: 'https://i.ytimg.com/vi/kp8bRd4Jh1g/hqdefault.jpg' });
  const quiz2 = await Quiz.create({
    topicId: new mongoose.Types.ObjectId(),
    title: 'Exception Handling Quiz',
    passingScore: 70,
    xpReward: 25,
    questions: [
      { type: 'mcq', question: 'Which block always executes after try-catch?', options: [{ text: 'catch', isCorrect: false }, { text: 'finally', isCorrect: true }, { text: 'throw', isCorrect: false }, { text: 'throws', isCorrect: false }], difficulty: 'easy', points: 10 },
      { type: 'mcq', question: 'Which exception is thrown when dividing by zero in Java?', options: [{ text: 'NullPointerException', isCorrect: false }, { text: 'IllegalArgumentException', isCorrect: false }, { text: 'ArithmeticException', isCorrect: true }, { text: 'RuntimeException', isCorrect: false }], difficulty: 'easy', points: 10 },
    ],
  });
  const topic2 = await Topic.create({ moduleId: javaModule1._id, trackId: javaTrack._id, title: 'Exception Handling & Errors', description: 'Master try-catch-finally, custom exceptions, and error handling patterns', order: 2, videoId: vid2._id, quizId: quiz2._id, xpReward: 40 });
  await Quiz.findByIdAndUpdate(quiz2._id, { topicId: topic2._id });

  // Module 2 topics
  const vid3 = await Video.create({ youtubeId: 'IIRdXmZ-EzY', title: 'Java Collections Framework', duration: 4800, thumbnailUrl: 'https://i.ytimg.com/vi/IIRdXmZ-EzY/hqdefault.jpg' });
  const topic3 = await Topic.create({ moduleId: javaModule2._id, trackId: javaTrack._id, title: 'ArrayList & LinkedList', description: 'Understand List implementations, their performance, and when to use each', order: 1, videoId: vid3._id, xpReward: 35 });

  const vid4 = await Video.create({ youtubeId: 'shs0KM3wKv8', title: 'HashMap and HashSet in Java', duration: 3200, thumbnailUrl: 'https://i.ytimg.com/vi/shs0KM3wKv8/hqdefault.jpg' });
  const topic4 = await Topic.create({ moduleId: javaModule2._id, trackId: javaTrack._id, title: 'HashMap, HashSet & Streams', description: 'Master Map/Set collections and Java 8 Streams API', order: 2, videoId: vid4._id, xpReward: 45 });

  // Module 3 topics
  const vid5 = await Video.create({ youtubeId: '9SGDpanrc8U', title: 'Spring Boot Tutorial', duration: 10800, thumbnailUrl: 'https://i.ytimg.com/vi/9SGDpanrc8U/hqdefault.jpg' });
  const topic5 = await Topic.create({ moduleId: javaModule3._id, trackId: javaTrack._id, title: 'Spring Boot & REST APIs', description: 'Build production-grade REST APIs with Spring Boot, Spring MVC and proper error handling', order: 1, videoId: vid5._id, xpReward: 60 });

  console.log('✅ Created Java Backend track with 5 topics');

  // ─── Track 2: MERN Stack ──────────────────────────
  const mernTrack = await Track.create({
    title: 'MERN Stack Development',
    slug: 'mern-stack',
    description: 'Build full-stack web applications using MongoDB, Express.js, React, and Node.js. From REST APIs to React hooks and deployment.',
    shortDescription: 'Build full-stack apps with MongoDB, Express, React & Node',
    category: 'fullstack',
    difficulty: 'intermediate',
    estimatedHours: 90,
    tags: ['react', 'nodejs', 'mongodb', 'express', 'fullstack'],
    isPublished: true,
    isPremium: false,
    order: 2,
    rating: 4.7,
    enrolledCount: 980,
    thumbnail: 'https://www.mongodb.com/developer/_next/image?url=https%3A%2F%2Fimages.contentstack.io%2Fv3%2Fassets%2Fblt39790b633ee0d5a7%2Fbltb8b9c4c7e1a3ac36%2F61e3e56e2ad28c2fb82a5de8%2Fmern-stack-b9q1kbudz0.png&w=1200&q=75',
  });

  const mernModule1 = await Module.create({ trackId: mernTrack._id, title: 'Node.js & Express.js', description: 'Server-side JavaScript with Node and Express', order: 1, estimatedHours: 20 });
  const mernModule2 = await Module.create({ trackId: mernTrack._id, title: 'React.js Fundamentals', description: 'Modern React with hooks and state management', order: 2, estimatedHours: 25 });
  const mernModule3 = await Module.create({ trackId: mernTrack._id, title: 'MongoDB & Mongoose', description: 'NoSQL database with Mongoose ODM', order: 3, estimatedHours: 15 });

  const vid6 = await Video.create({ youtubeId: 'Oe421EPjeBE', title: 'Node.js and Express.js Full Course', duration: 14400, thumbnailUrl: 'https://i.ytimg.com/vi/Oe421EPjeBE/hqdefault.jpg' });
  const mernQuiz1 = await Quiz.create({
    topicId: new mongoose.Types.ObjectId(),
    title: 'Node.js Basics Quiz',
    passingScore: 70,
    xpReward: 25,
    questions: [
      { type: 'mcq', question: 'What is the event loop in Node.js?', options: [{ text: 'A loop for events in the browser', isCorrect: false }, { text: 'A mechanism that handles asynchronous callbacks', isCorrect: true }, { text: 'A data structure', isCorrect: false }, { text: 'A built-in module', isCorrect: false }], difficulty: 'medium', points: 10 },
      { type: 'mcq', question: 'Which HTTP method is used to create a new resource?', options: [{ text: 'GET', isCorrect: false }, { text: 'PUT', isCorrect: false }, { text: 'POST', isCorrect: true }, { text: 'DELETE', isCorrect: false }], difficulty: 'easy', points: 10 },
    ],
  });
  const mernTopic1 = await Topic.create({ moduleId: mernModule1._id, trackId: mernTrack._id, title: 'Node.js & Express Fundamentals', description: 'Build your first REST API with Node.js and Express', order: 1, videoId: vid6._id, quizId: mernQuiz1._id, xpReward: 45 });
  await Quiz.findByIdAndUpdate(mernQuiz1._id, { topicId: mernTopic1._id });

  const vid7 = await Video.create({ youtubeId: 'w7ejDZ8SWv8', title: 'React Tutorial for Beginners', duration: 5400, thumbnailUrl: 'https://i.ytimg.com/vi/w7ejDZ8SWv8/hqdefault.jpg' });
  const mernTopic2 = await Topic.create({ moduleId: mernModule2._id, trackId: mernTrack._id, title: 'React Hooks & State Management', description: 'useState, useEffect, useContext and custom hooks', order: 1, videoId: vid7._id, xpReward: 50 });

  const vid8 = await Video.create({ youtubeId: 'c2fqr2sDY6o', title: 'MongoDB Tutorial', duration: 3600, thumbnailUrl: 'https://i.ytimg.com/vi/c2fqr2sDY6o/hqdefault.jpg' });
  const mernTopic3 = await Topic.create({ moduleId: mernModule3._id, trackId: mernTrack._id, title: 'MongoDB & Mongoose ODM', description: 'Design schemas, query MongoDB, and use Mongoose for data modeling', order: 1, videoId: vid8._id, xpReward: 40 });

  console.log('✅ Created MERN Stack track with 3 topics');

  // ─── Track 3: DSA ─────────────────────────────────
  const dsaTrack = await Track.create({
    title: 'Data Structures & Algorithms',
    slug: 'dsa',
    description: 'Master DSA for placement interviews. Arrays, LinkedLists, Trees, Graphs, Dynamic Programming, and problem-solving patterns.',
    shortDescription: 'Crack placement interviews with DSA mastery',
    category: 'dsa',
    difficulty: 'intermediate',
    estimatedHours: 100,
    tags: ['dsa', 'algorithms', 'placement', 'leetcode'],
    isPublished: true,
    isPremium: true,
    order: 3,
    rating: 4.9,
    enrolledCount: 2100,
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Binary_tree.svg/800px-Binary_tree.svg.png',
  });

  const dsaModule1 = await Module.create({ trackId: dsaTrack._id, title: 'Arrays & Strings', description: 'Foundation of DSA - arrays and string manipulation', order: 1, estimatedHours: 20 });
  const dsaModule2 = await Module.create({ trackId: dsaTrack._id, title: 'Trees & Graphs', description: 'Tree traversal, BST, and graph algorithms', order: 2, estimatedHours: 25 });

  const vid9 = await Video.create({ youtubeId: 'RBSGKlAvoiM', title: 'Data Structures Complete Course', duration: 15000, thumbnailUrl: 'https://i.ytimg.com/vi/RBSGKlAvoiM/hqdefault.jpg' });
  const dsaQuiz1 = await Quiz.create({
    topicId: new mongoose.Types.ObjectId(),
    title: 'Arrays & Time Complexity Quiz',
    passingScore: 70,
    xpReward: 40,
    questions: [
      { type: 'mcq', question: 'What is the time complexity of accessing an element in an array by index?', options: [{ text: 'O(n)', isCorrect: false }, { text: 'O(log n)', isCorrect: false }, { text: 'O(1)', isCorrect: true }, { text: 'O(n²)', isCorrect: false }], difficulty: 'easy', points: 10 },
      { type: 'mcq', question: 'Which sorting algorithm has worst-case time complexity of O(n log n)?', options: [{ text: 'Bubble Sort', isCorrect: false }, { text: 'Merge Sort', isCorrect: true }, { text: 'Insertion Sort', isCorrect: false }, { text: 'Selection Sort', isCorrect: false }], difficulty: 'medium', points: 10 },
      { type: 'mcq', question: 'What data structure does BFS use?', options: [{ text: 'Stack', isCorrect: false }, { text: 'Queue', isCorrect: true }, { text: 'Heap', isCorrect: false }, { text: 'Tree', isCorrect: false }], difficulty: 'medium', points: 10 },
    ],
  });
  const dsaTopic1 = await Topic.create({ moduleId: dsaModule1._id, trackId: dsaTrack._id, title: 'Arrays, Sorting & Searching', description: 'Master array manipulation, sorting algorithms, and binary search', order: 1, videoId: vid9._id, quizId: dsaQuiz1._id, xpReward: 60 });
  await Quiz.findByIdAndUpdate(dsaQuiz1._id, { topicId: dsaTopic1._id });

  const vid10 = await Video.create({ youtubeId: 'pkYVOmU3MgA', title: 'Tree Data Structure & Algorithms', duration: 7200, thumbnailUrl: 'https://i.ytimg.com/vi/pkYVOmU3MgA/hqdefault.jpg' });
  const dsaTopic2 = await Topic.create({ moduleId: dsaModule2._id, trackId: dsaTrack._id, title: 'Binary Trees & BST', description: 'Tree traversal (inorder, preorder, postorder), BST operations and balanced trees', order: 1, videoId: vid10._id, xpReward: 70 });

  console.log('✅ Created DSA track with 2 topics');

  // ─── Create Admin User ────────────────────────────
  const existingAdmin = await User.findOne({ email: 'admin@pathpilot.dev' });
  if (!existingAdmin) {
    await User.create({
      name: 'PathPilot Admin',
      email: 'admin@pathpilot.dev',
      password: 'admin123456',
      role: 'admin',
      plan: 'premium',
      planExpiry: new Date('2099-12-31'),
      xp: 9999,
      level: 20,
      streak: 100,
    });
    console.log('✅ Created admin user: admin@pathpilot.dev / admin123456');
  }

  // ─── Create Sample Student ────────────────────────
  const existingStudent = await User.findOne({ email: 'student@pathpilot.dev' });
  if (!existingStudent) {
    await User.create({
      name: 'Demo Student',
      email: 'student@pathpilot.dev',
      password: 'student123',
      role: 'student',
      plan: 'free',
      xp: 250,
      level: 3,
      streak: 5,
    });
    console.log('✅ Created demo student: student@pathpilot.dev / student123');
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('📋 Summary:');
  console.log('   - 3 Learning Tracks (Java, MERN, DSA)');
  console.log('   - 8 Modules');
  console.log('   - 10 Topics with Videos, Notes & Quizzes');
  console.log('   - 6 Badges');
  console.log('   - 2 Demo Users');
  console.log('\n🔑 Login credentials:');
  console.log('   Admin: admin@pathpilot.dev / admin123456');
  console.log('   Student: student@pathpilot.dev / student123');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
