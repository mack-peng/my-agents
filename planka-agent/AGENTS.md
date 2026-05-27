# Planka CLI Agent Guide

This guide provides instructions for AI agents working with the planka-cli tool to manage PLANKA self-hosted Kanban boards.

## Installation

```bash
npm install -g @orangemust/planka-cli
```

## Authentication

### Login (interactive - recommended)
```bash
planka-cli login
```

### Login (non-interactive)
```bash
planka-cli login --url https://your-planka.example.com --email you@example.com --password yourpassword
```

### Configuration
```bash
planka-cli config init --url https://planka.example.com --api-key YOUR_KEY
planka-cli config info
planka-cli config clear
```

### Auth Priority (highest to lowest)
1. CLI flags: `planka-cli --base-url <url> --api-key <key> <command>`
2. Environment: `PLANKA_BASE_URL`, `PLANKA_API_KEY`, `PLANKA_BEARER_TOKEN`
3. Config file: `~/.planka/config.json`

---

## Commands Reference

### Projects

| Command | Description |
|---------|-------------|
| `planka-cli projects list` | List all accessible projects |
| `planka-cli projects get <id>` | Get project details |
| `planka-cli projects create -n "My Project"` | Create a project |
| `planka-cli projects create -n "Name" -d "Description" -t private\|shared` | Create with options |
| `planka-cli projects update <id> -n "New Name"` | Update project name |
| `planka-cli projects update <id> --background-gradient "..."` | Update background |
| `planka-cli projects update <id> --favorite` | Mark as favorite |
| `planka-cli projects delete <id>` | Delete a project |

---

### Boards

| Command | Description |
|---------|-------------|
| `planka-cli boards get <id>` | Get board details |
| `planka-cli boards create <projectId> -n "My Board"` | Create a board |
| `planka-cli boards create <projectId> -n "Name" -p 1` | Create with position |
| `planka-cli boards update <id> -n "New Name"` | Update board |
| `planka-cli boards update <id> --default-view kanban\|grid\|list` | Set default view |
| `planka-cli boards delete <id>` | Delete a board |

---

### Lists

| Command | Description |
|---------|-------------|
| `planka-cli lists get <id>` | Get list details |
| `planka-cli lists create <boardId> -n "To Do"` | Create a list |
| `planka-cli lists create <boardId> -n "Name" -t active\|archived\|done` | Create with type |
| `planka-cli lists update <id> -n "New Name"` | Update list |
| `planka-cli lists update <id> -c <color>` | Set list color |
| `planka-cli lists delete <id>` | Delete a list |
| `planka-cli lists clear <id>` | Clear all cards from a list |
| `planka-cli lists move-cards <id> <toListId>` | Move all cards to another list |
| `planka-cli lists sort <id> -f <field> -o asc\|desc` | Sort cards in list |

---

### Cards

| Command | Description |
|---------|-------------|
| `planka-cli cards list <listId>` | List cards in a list |
| `planka-cli cards list <listId> --search <query>` | Search cards |
| `planka-cli cards list <listId> --user-ids <ids>` | Filter by users |
| `planka-cli cards list <listId> --label-ids <ids>` | Filter by labels |
| `planka-cli cards get <id>` | Get card details |
| `planka-cli cards create <listId> -n "My Card"` | Create a card |
| `planka-cli cards create <listId> -n "Name" -d "Description" --due-date "2024-12-31"` | Create with options |
| `planka-cli cards update <id> -n "New Name"` | Update card |
| `planka-cli cards update <id> -d "Description"` | Update description |
| `planka-cli cards update <id> --due-date "2024-12-31"` | Set due date |
| `planka-cli cards update <id> --due-completed` | Mark due as completed |
| `planka-cli cards update <id> --list-id <newListId>` | Move to another list |
| `planka-cli cards update <id> --subscribe` | Subscribe to card |
| `planka-cli cards delete <id>` | Delete a card |
| `planka-cli cards duplicate <id>` | Duplicate a card |
| `planka-cli cards duplicate <id> -n "Copy" --list-id <targetListId>` | Duplicate to list |

---

### Users

| Command | Description |
|---------|-------------|
| `planka-cli users list` | List all users |
| `planka-cli users get <id>` | Get user details |
| `planka-cli users create --email <email> --username <user> --password <pass> --name "Name"` | Create user |
| `planka-cli users update <id> --name "New Name"` | Update user |
| `planka-cli users update <id> --role admin\|user\|guest` | Set user role |
| `planka-cli users update <id> --deactivate` | Deactivate user |
| `planka-cli users delete <id>` | Delete user |
| `planka-cli users api-key <id>` | Create API key for user |
| `planka-cli users update-email <id> --email <newEmail>` | Update email |
| `planka-cli users update-password <id> --password <newPass>` | Update password |
| `planka-cli users update-username <id> --username <newUser>` | Update username |

---

### Comments

| Command | Description |
|---------|-------------|
| `planka-cli comments list <cardId>` | List comments on a card |
| `planka-cli comments create <cardId> -t "Comment text"` | Create a comment |
| `planka-cli comments update <id> -t "Updated text"` | Update a comment |
| `planka-cli comments delete <id>` | Delete a comment |

---

### Labels

| Command | Description |
|---------|-------------|
| `planka-cli labels create <boardId> -n "Bug" -c berry-red` | Create a label |
| `planka-cli labels create <boardId> -n "Name" -c <color> -p 1` | Create with position |
| `planka-cli labels update <id> -n "New Name"` | Update label |
| `planka-cli labels update <id> -c <newColor>` | Change label color |
| `planka-cli labels delete <id>` | Delete a label |

**Available colors:** berry-red, pink, grape, violet, indigo, blue, cyan, teal, green, lime, yellow, orange, pumpkin, peach

---

### Card Labels

| Command | Description |
|---------|-------------|
| `planka-cli card-labels add <cardId> <labelId>` | Add label to card |
| `planka-cli card-labels remove <cardId> <labelId>` | Remove label from card |

---

### Card Memberships (Card Members)

| Command | Description |
|---------|-------------|
| `planka-cli card-memberships add <cardId> <userId>` | Add member to card |
| `planka-cli card-memberships remove <cardId> <userId>` | Remove member from card |

---

### Board Memberships

| Command | Description |
|---------|-------------|
| `planka-cli board-memberships create <boardId> <userId> -r editor\|viewer` | Add user to board |
| `planka-cli board-memberships create <boardId> <userId> -r viewer --can-comment` | Add viewer who can comment |
| `planka-cli board-memberships update <id> -r editor` | Update membership role |
| `planka-cli board-memberships update <id> --can-comment` | Allow commenting |
| `planka-cli board-memberships delete <id>` | Remove user from board |

---

### Tasks (Checklist Items)

| Command | Description |
|---------|-------------|
| `planka-cli tasks create <taskListId> -n "Do this"` | Create a task |
| `planka-cli tasks create <taskListId> -n "Name" --completed` | Create as completed |
| `planka-cli tasks update <id> --completed` | Mark task complete |
| `planka-cli tasks update <id> --no-completed` | Mark task incomplete |
| `planka-cli tasks update <id> --assignee-user-id <userId>` | Assign user |
| `planka-cli tasks update <id> --task-list-id <newListId>` | Move to another list |
| `planka-cli tasks delete <id>` | Delete a task |

---

### Task Lists (Checklists)

| Command | Description |
|---------|-------------|
| `planka-cli task-lists get <id>` | Get task list details |
| `planka-cli task-lists create <cardId> -n "Checklist"` | Create task list |
| `planka-cli task-lists create <cardId> -n "Name" --hide-completed` | Hide completed |
| `planka-cli task-lists update <id> -n "New Name"` | Update task list |
| `planka-cli task-lists update <id> --hide-completed` | Hide completed tasks |
| `planka-cli task-lists update <id> --show-on-front` | Show on card front |
| `planka-cli task-lists delete <id>` | Delete task list |

---

### Custom Fields

| Command | Description |
|---------|-------------|
| `planka-cli custom-fields create <groupId> -n "Priority"` | Create custom field |
| `planka-cli custom-fields create <groupId> -n "Name" --show-on-front` | Show on card front |
| `planka-cli custom-fields create <groupId> --base` | Create in base group |
| `planka-cli custom-fields update <id> -n "New Name"` | Update custom field |
| `planka-cli custom-fields update <id> --show-on-front` | Show on front |
| `planka-cli custom-fields delete <id>` | Delete custom field |

---

### Custom Field Groups

| Command | Description |
|---------|-------------|
| `planka-cli custom-field-groups get <id>` | Get group details |
| `planka-cli custom-field-groups create-board <boardId> -n "Fields"` | Create on board |
| `planka-cli custom-field-groups create-board <boardId> -n "Name" --base-id <id>` | Link to base group |
| `planka-cli custom-field-groups create-card <cardId> -n "Fields"` | Create on card |
| `planka-cli custom-field-groups update <id> -n "New Name"` | Update group |
| `planka-cli custom-field-groups delete <id>` | Delete group |

---

### Base Custom Field Groups

| Command | Description |
|---------|-------------|
| `planka-cli base-custom-field-groups create <projectId> -n "Group"` | Create base group |
| `planka-cli base-custom-field-groups update <id> -n "New Name"` | Update base group |
| `planka-cli base-custom-field-groups delete <id>` | Delete base group |

---

### Custom Field Values

| Command | Description |
|---------|-------------|
| `planka-cli custom-field-values set <cardId> <groupId> <fieldId> -c "High"` | Set field value |
| `planka-cli custom-field-values delete <cardId> <groupId> <fieldId>` | Clear field value |

---

### Webhooks

| Command | Description |
|---------|-------------|
| `planka-cli webhooks list` | List all webhooks |
| `planka-cli webhooks create -n "Hook" -u https://example.com/hook -e moveCard,createCard` | Create webhook |
| `planka-cli webhooks update <id> -u <newUrl>` | Update webhook URL |
| `planka-cli webhooks update <id> -e events` | Update events |
| `planka-cli webhooks delete <id>` | Delete webhook |

**Webhook events:** createCard, updateCard, deleteCard, moveCard, createList, updateList, deleteList, createBoard, updateBoard, deleteBoard, createProject, updateProject, deleteProject

---

### Notifications

| Command | Description |
|---------|-------------|
| `planka-cli notifications list` | List user notifications |
| `planka-cli notifications get <id>` | Get notification details |
| `planka-cli notifications read <id>` | Mark as read |
| `planka-cli notifications unread <id>` | Mark as unread |
| `planka-cli notifications read-all` | Mark all as read |

---

### Notification Services

| Command | Description |
|---------|-------------|
| `planka-cli notification-services create-for-board <boardId> -u <url> -f text\|markdown\|html` | Create for board |
| `planka-cli notification-services create-for-user <userId> -u <url> -f text\|markdown\|html` | Create for user |
| `planka-cli notification-services update <id> -u <url>` | Update service |
| `planka-cli notification-services delete <id>` | Delete service |
| `planka-cli notification-services test <id>` | Test notification service |

---

### Actions (Activity Log)

| Command | Description |
|---------|-------------|
| `planka-cli actions board <boardId>` | Get board actions |
| `planka-cli actions board <boardId> --before-id <id>` | Paginate board actions |
| `planka-cli actions card <cardId>` | Get card actions |
| `planka-cli actions card <cardId> --before-id <id>` | Paginate card actions |

---

### Project Managers

| Command | Description |
|---------|-------------|
| `planka-cli project-managers create <projectId> <userId>` | Add project manager |
| `planka-cli project-managers delete <id>` | Remove project manager |

---

### Server Config (Admin)

| Command | Description |
|---------|-------------|
| `planka-cli server-config get` | Get server configuration |
| `planka-cli server-config update --smtp-host <host> --smtp-port 587` | Update SMTP |
| `planka-cli server-config update --smtp-user <user> --smtp-password <pass>` | Set SMTP credentials |
| `planka-cli server-config update --smtp-secure` | Enable SMTP SSL |
| `planka-cli server-config test-smtp` | Test SMTP configuration |

---

### Background Images

| Command | Description |
|---------|-------------|
| `planka-cli background-images upload <projectId> /path/to/image.png` | Upload background image |
| `planka-cli background-images delete <id>` | Delete background image |

---

### Miscellaneous

| Command | Description |
|---------|-------------|
| `planka-cli misc bootstrap` | Get application bootstrap data |
| `planka-cli misc terms` | Get terms and conditions |
| `planka-cli misc terms -l en` | Get terms in specific language |

---

## Common Patterns

### Finding IDs
Many commands require IDs. Use list commands to find them:
```bash
planka-cli projects list                    # Get project IDs
planka-cli boards get <projectId>           # Get board IDs (or use projects get)
planka-cli lists create <boardId> -n "..."  # After creating board
planka-cli cards list <listId>              # Get card IDs
planka-cli users list                       # Get user IDs
planka-cli labels create <boardId>          # After creating board
```

### Output Format
All output is JSON. Use tools like `jq` to parse:
```bash
planka-cli projects list | jq '.'
planka-cli projects list | jq '.[0].id'
```

### Global Options
Override config with CLI flags:
```bash
planka-cli --base-url https://planka.example.com --api-key YOUR_KEY projects list
```
