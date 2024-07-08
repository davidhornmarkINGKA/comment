const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

const getPullRequestsInRepo = async (owner, repo, accessToken) => {
  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}/pulls`
  };

  try {
    const { data: prs } = await axios(config);
    if (!prs) {
      return [];
    }

    const titleAndNumbers = prs.map((pr) => ({
      title: pr.title,
      number: pr.number
    }));

    return titleAndNumbers;
  } catch (error) {
    core.error('Error fetching PRs');
    core.error(error);
    return [];
  }
};

const postCommentOnPullRequests = async (
  owner,
  repo,
  prNumbers,
  comment,
  token,
  collector = []
) => {
  const sendComment = async (prNumber) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      },
      method: 'POST',
      url: `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      data: {
        body: comment
      }
    };
    try {
      const { data } = await axios(config);
      return data;
    } catch (error) {
      core.error(`Error posting comment to PR ${prNumber}`);
      return error;
    }
  };

  if (prNumbers.length === 0) {
    return collector;
  }

  const [prNumber, ...tail] = prNumbers;
  const response = await sendComment(prNumber);
  collector.push(response);
  return postCommentOnPullRequests(
    owner,
    repo,
    tail,
    comment,
    token,
    collector
  );
};

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const message = core.getInput('message', { required: true });
    const title = core.getInput('title', { required: true });
    const token = core.getInput('token', { required: true });

    core.info(`Looking for PRs containing: [${title}] in title...`);
    core.info(`Will attempt to comment with message: [${message}]...`);

    const { repo, owner } = github.context.repo;
    core.info(`Repo: ${repo}`);
    core.info(`Owner: ${owner}`);

    const prs = await getPullRequestsInRepo(owner, repo, token);
    const prNumbers = prs.map((pr) => pr.number);
    if (prNumbers.length === 0) {
      core.info('No PRs found, exiting...');
      return;
    }

    core.info(`Found ${prNumbers.length} PRs containing; [${title}] in title.`);
    core.setOutput('pr-numbers', prNumbers);

    const responses = await postCommentOnPullRequests(
      owner,
      repo,
      prNumbers,
      message,
      token
    );
    core.info(`Posted comments to ${responses.length} PRs`);
    core.debug(JSON.stringify(responses, null, 2));
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message);
  }
}

module.exports = {
  run
};
