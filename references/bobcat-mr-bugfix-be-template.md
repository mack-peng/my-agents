# Code Review for Bug Fix

|                | **References** |
| -------------- | -------------- |
| Jira Ticket    | REPLACE_URL    |
| Zendesk ticket | REPLACE_NAME   |
| Reviewer       | REPLACE_NAME   |

## Self-checklist for Code Submitter

### General

- [ ] I have read through the entire diff myself.
- [ ] The code can be **rolled back** without causing any issue to users.

### Reusability/Maintainability

- [ ] I have ensured that code is **DRY** and reused what others have written as much as possible.
- [ ] For code that’s unconventional, I have added comments to explain the reason for the change.
- [ ] The diff does not include unrelated code to the overall purpose of the changes.
- [ ] The diff does not contain any debugging code.
- [ ] I have squashed the commits into atomic steps before submitting for review.
- [ ] I have made sure to use meaningful commit messages to describe the changes.

### Performance

- [ ] Will the request return within 500ms?

### Compatibility

- [ ] The code will not cause any issue with existing user data.
- [ ] The code will not cause any issue with existing opened clients (such as opened browser tab or older version of iOS mobile APP).

### Security

- [ ] There is no concatenation of external input strings to form SQL queries and all inputs to SQL are filtered.
- [ ] Sensitive data are not stored directly (password, payment related, user credit card, user passport/national ID and etc.)
- [ ] Do not expose data to unauthorized access (exposing user A’s store orders to user B)

### Adding a New Third-party Library

If you are adding a new third-party library, please make sure to include this section. Otherwise, replace it with "not applicable"

- [ ] Is the license MIT or Apache? If not, have it reviewed by @dafeng.
- [ ] We do not have a library that does similar thing (Do not include libraries that achieve similar goals).

### Others

- [ ] I understand that only reviewers should resolve comments.
- [ ] I understand that I will push commits based on earlier rounds of comment/feedback as isolated commits to the branch. I will not squash until the branch is ready to merge. (squashing will remove all comments)
- [ ] I will be thorough and respond to every comment.
