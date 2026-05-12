# 🚀 G&G Cleaning Service: Manual Deployment SOP

This document outlines the **Standard Operating Procedure** for manually deploying updates to GG Cleaning Service. Follow these steps strictly to ensure the production site is always up-to-date and bug-free.

---

## ⚠️ CRITICAL REMINDER
**NEVER upload an old `dist` folder.** 
A `dist` folder that was built 10 minutes ago is already "old" if you have made code changes since then. Always run a fresh build immediately before uploading.

---

## 🛠️ Phase 1: The Build Process

Before every deployment, you must compile the source code into production assets.

1.  **Open Terminal** in the `gg-cleaning-web` directory.
2.  **Run the Build Command:**
    ```bash
    npm run build
    ```
3.  **Wait for Completion:** Ensure the terminal shows `✓ built in X.Xs` and no red error messages appear.

### How to Verify the `dist` Folder is Fresh
Do not trust your memory. Verify the files:
- **Check Timestamp:** In Windows Explorer, right-click the `dist` folder -> Properties. The "Date modified" should be within the last 60 seconds.
- **Check for Recent Changes:** Open `dist/index.html` in a text editor (like Notepad) and search for a unique keyword you recently added (e.g., "$40 OFF"). If it's not there, the build failed or was not run.

---

## 📤 Phase 2: Netlify Manual Upload

1.  **Login to Netlify:** Go to [app.netlify.com](https://app.netlify.com).
2.  **Select Your Site:** Click on the G&G Cleaning project.
3.  **Navigate to Deploys:** Click the **"Deploys"** tab in the top navigation.
4.  **Drag and Drop:**
    - Look for the box at the bottom that says **"Need to update your site? Drag and drop your site output folder here."**
    - Drag the **ENTIRE** `dist` folder from your computer into that box.
    - **Note:** Do NOT drag the individual files inside `dist`. Drag the folder itself.
5.  **Wait for "Published":** The status will change from "Uploading" to "Processing" to **"Published"**.

---

## 🔍 Phase 3: Post-Deployment QA Checklist

Once the site is live, perform these 5 checks immediately:

1.  **[ ] The "$40 Off" Banner:** Is it visible at the top? Does the "Claim Discount" button open the estimate widget?
2.  **[ ] Navbar Check:** Is the navigation bar positioned correctly below the banner? Does it overlap anything?
3.  **[ ] Mobile View:** Open the site on your phone. Is the banner readable? Does the menu still work?
4.  **[ ] "Mother's Day" Check:** Try to visit the old Mother's Day URL. It should show a 404 or be inaccessible.
5.  **[ ] Form Test:** Submit a test estimate. Ensure you receive the confirmation email/notification.

---

## ⏪ Phase 4: Rollback Instructions

If something breaks, do not panic. You can revert to a previous version in seconds.

1.  Go to the **"Deploys"** tab in Netlify.
2.  Find the previous build (the one that was working before your latest upload).
3.  Click on that deploy.
4.  Click the **"Publish deploy"** button.
5.  The site will instantly revert to the old version.

---

## 🚫 Common Mistakes to Avoid

- **Uploading the root folder:** Only upload the `dist` folder. Uploading the whole project will result in a "Page Not Found" error because Netlify won't find an `index.html` in the root.
- **Skipping `npm run build`:** If you skip this, you are just re-uploading the same old code.
- **Interrupted Uploads:** If your browser or internet crashes during the drag-and-drop, start over.

---

## 🧠 Diagnosis: Git Contributor/Build Issue

**Issue:** You are currently unable to use "Automatic Deploys" (GitHub-to-Netlify) due to a "Git Contributor" error.

**Diagnosis:** 
Netlify recently changed its pricing model. If your GitHub repo belongs to an **Organization** or is in a **Netlify Pro Team**, Netlify counts every person who commits to the repo as a "seat." If the person pushing code (you or an assistant) is not an "Owner" or "Member" in your Netlify account, Netlify blocks the build to prevent unexpected charges for a new seat (often $19-$99/mo).

### Safest Resolution Options (No Secret Leaks)

| Option | Ease | Safety | Description |
| :--- | :--- | :--- | :--- |
| **1. Netlify CLI** | ⭐⭐⭐ | 🔒🔒🔒 | Use the Netlify CLI to "push" the build. This bypasses the GitHub connector and the seat limit entirely because the build happens on your machine. |
| **2. GitHub Action** | ⭐⭐ | 🔒🔒🔒 | Set up a GitHub Action to run the build and send the `dist` folder to Netlify via a "Site ID" and "Auth Token." This counts as only 1 "System User" seat. |
| **3. Invite as "Reviewer"** | ⭐ | 🔒🔒 | Invite the contributor to Netlify as a "Reviewer" (usually free) rather than a "Collaborator." This sometimes unlocks the build without adding a paid seat. |
| **4. Manual SOP** | ⭐⭐⭐⭐ | 🔒🔒🔒 | Continue using this Manual SOP. It is 100% free and gives you total control over when the site updates. |

**Recommendation:** For now, stick to the **Manual SOP**. It is the safest way to ensure no "surprise" bills from Netlify while we keep your repo private and your secrets secure.
