# Code Review for Bug Fix

|                | **References** |
| -------------- | -------------- |
| Jira Ticket    | REPLACE_URL    |
| Zendesk ticket | REPLACE_NAME   |
| Reviewer       | REPLACE_NAME   |

## Problem Solving Process

### Description

Please clearly describe the problem in concise sentences and provide screenshots or a link to the problem

### Reason

Please briefly explain what is the real cause of the problem

### Solution

Please elaborate on the methods and ideas to solve the problem

### Scope Of Impact

List the scope of impact of code changes through a checklist and notify QA

### Test Result

Please provide screenshots or links after fixing the problem

## Self-checklist for Code Submitter

### General

- [ ] I have read through the entire diff myself.
- [ ] The code can be **rolled back** without causing any issue to users.

### Reusability/Maintainability

- [ ] I have ensured that code is **DRY** and reused what others have written as much as possible.
- [ ] For code that's unconventional, I have added comments to explain the reason for the change.
- [ ] The diff does not include unrelated code to the overall purpose of the changes.
- [ ] The diff does not contain any debugging code.
- [ ] The diff has been linted to conform to code conventions.
- [ ] I have squashed the commits into atomic steps before submitting for review.
- [ ] I have made sure to use meaningful commit messages to describe the changes.
- [ ] All CSS complies with these guidelines: https://cd.i.strikingly.com/strikingly/Bobcat/wikis/CSS-Quality

### Compatibility

- [ ] The code will not cause any issue with existing user data.
- [ ] The code will not cause any issue with existing opened clients (such as opened browser tab or older version of iOS mobile APP).
- [ ] The style change is compatible with mobile clients.

### Adding a New Third-party Library

If you are adding a new third-party library, please make sure to include this section. Otherwise, replace it with "not applicable"

- [ ] Is the license MIT or Apache? If not, have it reviewed by @dafeng.
- [ ] We do not have a library that does similar thing (Do not include libraries that achieve similar goals).

### Others

- [ ] I understand that only reviewers should resolve comments.
- [ ] I understand that I will push commits based on earlier rounds of comment/feedback as isolated commits to the branch. I will not squash until the branch is ready to merge. (squashing will remove all comments)
- [ ] I will be thorough and respond to every comment.
