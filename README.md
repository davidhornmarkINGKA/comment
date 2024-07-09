# PR Comment Action

This action serves the purpose of commenting a message of your choice on PRs
which's title includes your search string.

## Example usage

```yaml
comment-rebase-on-prs:
  runs-on: ubuntu-latest
  steps:
    - name: Comment on Version Bump PRs
      uses: davidhornmarkINGKA/comment@v0.1.1
      with:
        token: ${{ secrets.TOKEN }}
        message: '/rebase'
        title: 'Automatic version bump on'
```

## Inputs

- token: The access token to use for authentication.
- title: The string to search for in the PR title.
- message: The message to comment on the PR.

## Outputs

- pr-numbers: The PR numbers that the action commented on.

## Requesting a feature

If you have a feature request, please open an issue and describe your request.
