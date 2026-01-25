<img width="1584" height="396" alt="Image" src="https://github.com/user-attachments/assets/b311ce3c-c359-4fd3-81f6-53599fab3cfd" />

<div align="center">
  <h1>Iunami.AI</h1>
  <p><strong>A sleek, voice-powered bridge between your thoughts and your Notion Workspace.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Version-1.0.0-black?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/Built%20With-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
  </p>
</div>

---

## 🌊 Overview

**Iunami.AI** is a Chrome Extension designed to simplify personal knowledge management. Instead of navigating through complex Notion pages, Iunami allows you to connect multiple dashboards, view child databases at a glance, and eventually capture voice notes directly into your workspace.



## ✨ Key Features

<ul>
  <li><strong>Multi-Dashboard Support:</strong> Link multiple Notion pages as high-level "Workspaces."</li>
  <li><strong>Live Notion Sync:</strong> Fetches titles, child databases, and icons (emojis or images) directly from the Notion API.</li>
  <li><strong>Smart Refresh:</strong> Individually update workspaces to stay in sync with Notion's temporary file URLs and name changes.</li>
  <li><strong>Modern UI:</strong> A clean, "Glassmorphism-inspired" interface built with <strong>Tailwind CSS v4</strong> and <strong>Lucide Icons</strong>.</li>
  <li><strong>Privacy First:</strong> Your Notion Token is stored locally in your browser's encrypted storage.</li>
</ul>

---

## 🚀 Getting Started

### 1. Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/your-username/iunami-extension.git](https://github.com/your-username/iunami-extension.git)
Install dependencies:

Bash
npm install
Build the project:

Bash
npm run build
2. Loading into Chrome
Open Chrome and navigate to chrome://extensions/.

Enable Developer Mode (top right).

Click Load unpacked and select the dist folder in your project directory.

🛠️ Technical Stack
<table width="100%"> <tr> <td width="50%"><strong>Framework</strong></td> <td>React 18 + Vite</td> </tr> <tr> <td><strong>Styling</strong></td> <td>Tailwind CSS v4 (PostCSS)</td> </tr> <tr> <td><strong>Icons</strong></td> <td>Lucide React</td> </tr> <tr> <td><strong>API</strong></td> <td>Notion API (via Chrome Service Worker)</td> </tr> <tr> <td><strong>Storage</strong></td> <td>Chrome Local Storage API</td> </tr> </table>

📸 Screenshots
Build in Progress... <br>
Coming Soon..