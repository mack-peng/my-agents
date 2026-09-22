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

### Modeling & Design

- [ ] The code is implemented with clear boundary of responsibility, loosely coupling between modules
- [ ] The merge request reuses existing code as much as possible and does not reinvent wheel
- [ ] The merge request does not contain duplicated code
- [ ] The merge request does not include too much hard code, especially magic number/literal value

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

### System Robustness - Error/Exception Handling

- [ ] The code does not swallow exception/error without proper handling or notification to Bugsnag
  - Send predefined error code/type via API response so frontend knows how to handle it
  - Send the error to bugsnag so we are aware of the error (especially unknown error that never happened before) and can improve the way we handle it

### System Robustness - 3rd Party Failure Handling

*If the implementation doesn’t involve any 3rd party, check the following item*

- [ ] The implementation doesn’t involve any 3rd party service interaction

*If the implementation involves any 3rd party, the following items must be checked or explicit justification must be provided below*

- [ ] The code has implemented retry logic properly in case of 3rd party failure, if 3rd party interaction is involved
  - It’s implemented with idempotence when state transition is present
  - It’s implemented with ending condition and the retry logic eventually ends no matter what happens
- [ ] The code has implemented fallback logic properly in case of 3rd party failure, if 3rd party interaction is involved
  - Store the data (with periodic sync if necessary) and use the local copy instead (with 3rd party being the fallback when the local copy is missing) when we only read from 3rd party and we don't need the data to be real time

### Heavy IO

- [ ] The design doesn’t introduce heavy disk/network/database throughput with production data scale
  - Avoid reading data that's not needed (for example, select *) from database or API (if it provides ways to only fetch data that's needed)
  - Avoid reading large amount of data at once (for example fetch more than 100 rows of data at once)
  - Avoid writing data in a surge when there's no real-time requirement. Spread it instead
  - Avoid repetitive writing to same piece of data in a short time. Only update the latest version

### Compatibility

*If the MR doesn’t involve format/properties change to existing data, check the following item*

- [ ] The MR doesn’t involve format/properties change to existing data

*If the MR involves format/properties change to existing data, the following items must be checked or explicit justification must be provided below*

- [ ] The code has implemented logic that handles existing data properly and thus does not causes issues with existing data
  - It transforms existing data to new format on demand if possible
  - It adds grandfathering logic to handle existing data if transforming to new format is not possible
- [ ] The code has implemented logic that handles existing open clients properly and thus does not cause issues with existing opened clients (such as opened browser tab or older version of iOS mobile APP)
  - It only adds keys/properties to existing data format and does not change or remove existing keys/properties
  - It does not change the product logic of existing keys/properties

### Security

- [ ] The code does not concatenate external input strings to form SQL queries
- [ ] The code does not send inputs to SQL without sanitization
- [ ] The code does not store sensitive data directly (password, payment related, user credit card, user passport/national ID and etc.)
- [ ] The code does not expose data to unauthorized access (exposing user A’s store orders to user B)
- [ ] The code does not introduce CORS, XSS and CSRF vulnerabilities
- [ ] The code does not introduce CSP (Content Security Policy) vulnerabilities

### Time/space Complexity

- [ ] The merge request does not include inefficient code with high time complexity (must give explicit justification for anything over O(n*n))
- [ ] The merge request does not include inefficient code with high memory footprint (must give explicit justification for anything over O(n))

### Database Changes - DB Migration

*If the MR does not involve database migration, check the following item*

- [ ] The MR does not involve DB migration

*If the MR involves database migration, the following item must be checked or explicit justification must be provided below*

- [ ] The database migration code matches the following conditions, if applicable. Give explicit justification and get sign-off for exemptions
  - Indices are properly added to columns used in where clause
  - Combined indices are used when combined conditions are present in where clause
  - Use concurrent mode when adding index to columns with existing data
  - Check duplicate data before adding index with uniqueness constraint
  - Check null data before adding index with non-empty constraint
  - Add new migration to update db schema instead of modifying existing migration files
  - Does not include one-off data migration/transformation logic in DB migration files

### Database Changes - DB Queries

*If the MR does not add new queries or update existing queries, check the following item*

- [ ] The MR does not add new queries or update existing queries

*If the MR adds new queries or updates existing queries, the following item must be checked or explicit justification must be provided below*

- [ ] The new/updated database query code (including select, insert, update, delete, etc) matches the following conditions, if applicable. Give explicit justification and get sign-off for exemptions
  - Does not introduce N+1 problem
  - Does not call data transformation in where clause, unless explicit justification is given and signed off
  - Does not insert large number of records one by one in short time (insert in batch instead)
  - Does not join more than 3 tables in a single query, unless explicit justification is given and signed off

### Database Changes - One-off Data Migration/Transformation

*If the MR does not involve one-off data migration/transformation, check the following item*

- [ ] The MR does not involve one-off data migration/transformation

*If the MR involves one-off data migration/transformation, the following item must be checked or explicit justification must be provided below*

- [ ] One-off data migration/transformation logic should be implemented in a separate script and ran in Rails console and the code design must specify when it should be ran as part of the release checklist
  - If the data migration/transformation logic adds data/properties to existing data, it should be ran before the deployment
  - If the data migration/transformation logic removes data/properties from existing data, it should be ran before the deployment

### Concurrency

- [ ] The code matches the following conditions, and thus has low possibility causing concurrency issues, if applicable. Give explicit justification and get sign-off for exemptions
  - It does not send sync request to another service (our service or 3rd party) when the response is not immediately required by the main thread that handles requests
  - The code doesn’t lead to undetermined behavior introduced by async operations (for example, sidekiq job, should fix it with proper inter-thread/inter-process communication)
  - The merge request wraps code in transactions when the code needs to be atomic
  - The code puts DML (data modification language, namely insert, update, delete, etc) code after 3rd party requests or redis operations in transaction, avoid partial rollback as much as possible
  - The code has implemented proper logic handling partial transaction rollback (3rd party requests won’t automatically rollback)
  - The code is written in a way that avoids deadlock as much as possible
  - The code has properly handled race condition in non-DB scenario (redis, 3rd party resource, etc)

### Code Readability

- [ ] The code contains comments explaining what’s going on with unconventional code
- [ ] The merge request does not contain unrelated code to the overall purpose of the changes
- [ ] The merge request does not contain debugging code
- [ ] The merge request does not contain debug log output without leveraging logging levels
- [ ] The merge request is squashed with commits in atomic steps
- [ ] The commit messages follow the convention: https://www.conventionalcommits.org/en/v1.0.0/

### Language & Framework

- [ ] The code follows general language conventions
  - Ruby: https://rubystyle.guide/
  - Names classes/properties/variables in ruby language convention
  - Classes/properties/variables names are easy to understand and don’t lead to ambiguity/confusion
- [ ] The code follows general framework conventions
  - Rails: https://rails.rubystyle.guide/
  - Rspec: https://rspec.rubystyle.guide/

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

- [ ] The merge request doesn’t add library with non-MIT or non-Apache license
- [ ] The merge request does not add library with similar functionality as another existing library
- [ ] The merge request does not add library without pinning its version
