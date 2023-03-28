# Remote Sync

Just some magic

## Setup Repo

1. Create a new repo
2. In "General" setting:
    - In "Pull Requests" section leave checkmark only on "Allow squash merging" only.
    - Turn on "Automatically delete head branches"

3. In "Actions -> General" settings:
    - In "Workflow permissions" check "Read and write permissions"
    - Turn on "Allow GitHub Actions to create and approve pull requests"

4. Add two workflows from `wf` directory
    - The first one is checking remote repo and creates a new PR with changes to the latest version
    - The second one creates a new tag if the version PR was merged
    - Update remote repo url in `sync.yml` action
    - Adjust cron schedule in `sync.yml` action
