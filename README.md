git clone https://github.com/detailongo/app.git
cd app
npm install --legacy-peer-deps
npm run dev




Step 1: Commit and Push Changes to GitHub
Stage All Changes: If you've made changes to your project files, stage them for a commit:

git add .
Commit Your Changes: Write a commit message to describe what changes were made:

git commit -m "Update project files"
Push Changes to GitHub: Push your changes to the main branch on GitHub:

git push origin main
Step 2: Verify Files on GitHub
Go to your GitHub repository:
https://github.com/detailongo/my-next-app
Confirm that all your files and changes are visible.
Step 3: Delete Local Files
Once you’ve confirmed everything is on GitHub, delete the local copy of the project to free up space:

Navigate to your home directory (if not already there):

cd ~
Remove the my-next-app folder:

rm -rf ~/my-next-app
Verify that the directory has been deleted:

ls
Ensure my-next-app is no longer listed.

REMOVE UNNEEDED PACKAGES AND FREE SPACE:
View Overall Usage for Home Directory
du -sh ~/

View Breakdown of Space Usage in Home Directory
du -h --max-depth=1 ~/

View Available and Used Space for Home Directory Filesystem
df -h ~/

You can safely clean up cache:
rm -rf ~/.cache/*

Check for large folders inside .local:
du -h --max-depth=1 ~/.local

pnpm store prune


After cleaning the pnpm store, check the updated usage:
du -h --max-depth=1 ~/.local




