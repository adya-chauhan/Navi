# Navi - Kids Online Safety Buddy

Navi is a mobile app I built to help kids stay safe from cyberbullying and protect their personal information online. Instead of tracking or reading through private chats, Navi runs directly on the device to spot mean messages or unsafe questions in real time and give kids polite, helpful ways to respond.

## Features

* **Real-Time Safety Warnings:** Catches cyberbullying and private info requests (like addresses or phone numbers) before messages send.
* **Constructive Choices:** When an alert triggers, kids get three options: ignore and pivot, send a polite reply, or alert a trusted adult.
* **Parent Insights Dashboard:** Lets parents see safety scores and warning trends without reading private chat messages.
* **Local AI:** Uses an on-device text classifier and a local Gemma 2B model via Ollama for helpful reply suggestions.

## How It Works

The app uses a lightweight text classifier trained on cyberbullying datasets to calculate an instant confidence score on words in each message. If a message is flagged with high confidence, Navi pops up to help the child handle the situation safely.

## Tech Stack

* React Native & Expo (iOS, Android, Web)
* Custom Naive Bayes Classifier + Google Gemma 2B (via Ollama)
* Supabase (Database & real-time chat sync)

## Running the App

```bash
npm install
npx expo start
```

---

Made with ❤️ by Adya
