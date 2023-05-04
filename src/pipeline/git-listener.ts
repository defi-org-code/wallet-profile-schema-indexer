import { exec } from 'child_process';
import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();

export async function checkForUpdates(): Promise<void> {
  try {
    // Fetch the latest changes from the remote repository
    await git.fetch();

    // Check if the local branch is behind the remote branch
    const status = await git.status();

    if (status.behind > 0) {
      console.log('Updates detected, pulling changes...');

      // Pull the changes
      await git.pull();

      console.log('Changes pulled, restarting the application...');
      restartApplication();
    } else {
      console.log('No updates detected');
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

function restartApplication(): void {
  // Replace 'your-script.ts' with the entry point of your application
  exec('npm restart', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error restarting application: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error restarting application: ${stderr}`);
      return;
    }
    console.log(`Application restarted: ${stdout}`);
  });
}
