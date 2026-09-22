# Final Code Review

|                 | **References** |
| --------------- | -------------- |
| Code Design Doc | REPLACE_URL    |
| TL              | REPLACE_NAME   |
| Reviewer        | REPLACE_NAME   |

## Self-checklist for Code Submitter

### General

- [ ] I have read through the entire diff myself
- [ ] The title of the MR doesn't have WIP
- [ ] The code change is the same as described in the code design doc. If there are differences, I have marked them out and added comments to explain why
- [ ] The code can be **rolled back** without causing any issue to users
- [ ] I understand that only reviewers should resolve comments
- [ ] I understand that I will push commits based on earlier rounds of comment/feedback as isolated commits to the branch. I will not squash until the branch is ready to merge. (squashing will remove all comments)
- [ ] I will be thorough and respond to every comment

- [ ] I understand that only reviewers should resolve comments
- [ ] I understand that I will push commits based on earlier rounds of comment/feedback as isolated commits to the branch. I will not squash until the branch is ready to merge. (squashing will remove all comments)
- [ ] I will be thorough and respond to every comment

### Modeling & Design

- [ ] The code is implemented with clear boundary of responsibility, loosely coupling between modules
- [ ] The merge request reuses existing code as much as possible and does not reinvent wheel
- [ ] The merge request does not contain duplicated code
- [ ] The merge request does not include too much hard code, especially magic number/literal value

### Reusability - General

- [ ] New code should not be based on an outdated framework/technology (Angular.js, Haml and etc.) unless there’s explicit approval
- [ ] All CSS complies with these guidelines: https://cd.i.strikingly.com/strikingly/Bobcat/wikis/CSS-Quality

### Reusability - Strikingly & SXL

*If the spec scope is Strikingly/SXL only, check the following item*

- [ ] The spec scope is Strikingly only
- [ ] The spec scope is SXL only

*If the spec scope is not Strikingly/SXL only, the following item must be checked or explicit justification must be provided below*

- [ ] The code was not hard coded with the assumption that it will only work for Strikingly or SXL, unless clearly specified in spec scope

### Reusability - Website & WMP

*If the spec scope is specific to only website or certain WMP type, check the following item*

- [ ] The spec scope is specific to only website
- [ ] The spec scope is specific to only certain WMP type

*If the spec scope is not specific to only website or certain WMP type, the following item must be checked or explicit justification must be provided below*

- [ ] The code was not hard coded with the assumption that it will only work for websites or any specific WMP type, unless clearly specified in spec scope

### System Robustness - Backend Failure Handling

- [ ] The code has implemented a fallback UI and a mechanism for user to manually retry in case of backend failure
- [ ] The code does not swallow exception/error without proper handling or notification to Bugsnag
  - Prompt the user with correct info to guide him/her of next step
  - Log the error in js console for debug
  - Send the error to bugsnag so we are aware of the error (especially unknown error that never happened before) and can improve the way we handle it

### System Robustness - 3rd Party Failure Handling

*If the implementation doesn’t involve any 3rd party, check the following item*

- [ ] The implementation doesn’t involve any 3rd party service interaction

*If the implementation involves any 3rd party, the following items must be checked or explicit justification must be provided below*

- [ ] The code has implemented retry logic properly in case of 3rd party failure, if 3rd party interaction is involved
  - It’s implemented with idempotence when state transition is present
  - It’s implemented with ending condition and the retry logic eventually ends no matter what happens
- [ ] The code has implemented a fallback UI and a mechanism for user to manually retry in case of 3rd party failure, if 3rd party interaction is involved

### Performance

- [ ] The code does not introduce intensive CPU usage that freezes main thread, including but not limited to:
  - Unnecessary re-rendering of expensive UI (element with more than 100 child nodes)
  - Unoptimized data processing code
    - Serialize and deserialize large JSON
- [ ] The code does not introduce intensive IO that freezes main thread, including but not limited to:
  - Repeated network request in <1 min, unless explicit justification is provided and signed off

### Compatibility - Existing Data

*If the MR doesn’t involve format/properties change to data pulled from the backend API, check the following item*

- [ ] The MR doesn’t involve format/properties change to existing data

*If the MR involves format/properties change to data pulled from the backend API, the following item must be checked or explicit justification must be provided below*

- [ ] The code does not change/delete existing keys/properties when saving/updating data pulled from backend API

### Compatibility - Mobile

*If the spec scope clearly says there’s no need to optimize for mobile, check the following item*

- [ ] The spec scope clearly says there’s no need to optimize for mobile

*If the spec scope does not clearly say there’s no need to optimize for mobile, the following item must be checked or explicit justification must be provided below*

- [ ] The code functions according to spec on mobile screen resolution of 375x667 (iPhone 6/7/8)

### Security

- [ ] The code does not expose sensitive data in URL (password, payment related, user credit card, user passport/national ID and etc)

### Compliance

*If the MR does not involve WMP code change or does not increase WMP bundle size, check the following item*

- [ ] The MR does not involve WMP code change or does not increase WMP bundle size

*If the MR involves WMP code change or increases WMP bundle size, the following item must be checked*

- [ ] WMP bundle is less than Wechat requirement

### Time/space Complexity

- [ ] The merge request does not include inefficient code with high time complexity (must give explicit justification for anything over O(n*n))
- [ ] The merge request does not include inefficient code with high memory footprint (must give explicit justification for anything over O(n))

### Concurrency

- [ ] The code does not introduce undetermined behavior caused by async operations
  - It does not use React state immediately after calling setState
  - It does not depend on async loaded script

### Code Readability

- [ ] The code contains comments explaining what’s going on with unconventional code
- [ ] The merge request does not contain unrelated code to the overall purpose of the changes
- [ ] The merge request does not contain debugging code
- [ ] The merge request does not contain debug log output without leveraging logging levels
- [ ] The merge request is squashed with commits in atomic steps
- [ ] The commit messages follow the convention: https://www.conventionalcommits.org/en/v1.0.0/

### Language & Framework

- [ ] The code follows general language conventions
  - It follows our eslintrc convention
  - It uses map/reduce when describing data changes
  - It names classes/properties/variables in JS language convention
  - Classes/properties/variables names are easy to understand and don’t lead to ambiguity/confusion
- [ ] The code follows general framework conventions
  - It does not use DOM operations in React

### i18n

*If the MR does not require i18n, check the following item*

- [ ] The MR does not require i18n

*If the MR requires i18n, the following items must be checked or explicit justification must be provided below*

- [ ] The code translates Injected values properly in case of interpolation
- [ ] The merge request does not have dynamic code in i18n string text (should be static with interpolation)
- [ ] The code handles date & time values in the proper way
- [ ] The code handles currency values in the proper way
- [ ] The code handles zero decimal currencies (JPY, TWD, etc) properly

### 3rd party Library

*If the MR does not add new libraries, check the following item*

- [ ] The MR does not add new libraries

*If the MR adds new libraries, the following items must be checked or explicit justification must be provided below*

- [ ] The merge request does not add library with non-MIT or non-Apache license
- [ ] The merge request does not add library with similar functionality as another existing library
- [ ] The merge request does not add library without pinning its version
- [ ] The merge request does not add library with size > 10Kb when gzipped
