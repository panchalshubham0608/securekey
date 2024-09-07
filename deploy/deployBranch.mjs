import { AmplifyClient, CreateDeploymentCommand } from "@aws-sdk/client-amplify";
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
  .option('appId', {
    alias: 'a',
    type: 'string',
    description: 'AWS Amplify app ID',
    demandOption: true,
  })
  .option('branchName', {
    alias: 'b',
    type: 'string',
    description: 'Branch name to deploy',
    demandOption: true,
  })
  .option('region', {
    alias: 'r',
    type: 'string',
    description: 'AWS region',
    demandOption: true,
  })
  .help()
  .argv;

const { appId, branchName, region } = argv;

// Initialize AWS Amplify Client with region
const amplifyClient = new AmplifyClient({ region });

const deployBranch = async () => {
  try {
    // Create new deployment using AmplifyClient
    const createDeploymentCommand = new CreateDeploymentCommand({
      appId,
      branchName,
    });

    const response = await amplifyClient.send(createDeploymentCommand);
    console.log(`Deployment started for branch ${branchName} with Job ID: ${response.jobId}`);
  } catch (error) {
    console.error(`Error deploying branch ${branchName}:`, error);
  }
};

deployBranch();
