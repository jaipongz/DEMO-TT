# CMS Authentication & Authorization System

Complete authentication and authorization system with JWT, Role-Based Access Control (RBAC), and Permission checking.

## Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control (RBAC)**: Define roles and assign permissions
- **Permission System**: Granular control over module actions (create, read, update, delete)
- **User Management**: Complete user CRUD operations
- **Password Hashing**: Bcrypt password encryption
- **Automatic JWT Expiration**: 24-hour token expiration

## Architecture

### Modules

1. **Auth Module** (`/modules/auth`)
   - Login endpoint
   - JWT strategy and guards
   - Role and Permission guards
   - Decorators for RBAC

2. **CMS User Module** (`/modules/cms-user`)
   - User entity with role relationships
   - User CRUD operations
   - Password validation and hashing

3. **Role Module** (`/modules/role`)
   - Role management
   - Permission assignment to roles

4. **Permission Module** (`/modules/permission`)
   - Permission definitions
   - Associated with modules and actions

## Database Schema

### Relationship Diagram

```
CMS Users (1:M) -> User Roles (M:M) <- Roles (1:M) -> Role Permissions (M:M) <- Permissions
```

### Tables

- `wcm_users`: User accounts
- `wcm_roles`: Role definitions
- `wcm_permissions`: Permission definitions
- `wcm_user_roles`: User-to-Role mapping
- `wcm_role_permissions`: Role-to-Permission mapping

## API Endpoints

### Authentication

```bash
# Login
POST /auth/login
Body: {
  "email": "admin@example.com",
  "password": "admin123"
}

Response: {
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-1",
    "email": "admin@example.com",
    "name": "Admin User",
    "roles": [...]
  }
}
```

### User Management

```bash
# Create user
POST /wcm-users
Authorization: Bearer {token}

# Get all users
GET /wcm-users
Authorization: Bearer {token}

# Get user by ID
GET /wcm-users/:id
Authorization: Bearer {token}

# Update user
PUT /wcm-users/:id
Authorization: Bearer {token}

# Delete user
DELETE /wcm-users/:id
Authorization: Bearer {token}
```

### Role Management

```bash
# Get all roles
GET /wcm-roles

# Get role by ID
GET /wcm-roles/:id

# Create role
POST /wcm-roles
Authorization: Bearer {token}

# Update role
PUT /wcm-roles/:id
Authorization: Bearer {token}

# Delete role
DELETE /wcm-roles/:id
Authorization: Bearer {token}
```

### Permission Management

```bash
# Get all permissions
GET /wcm-permissions

# Get permission by ID
GET /wcm-permissions/:id

# Create permission
POST /wcm-permissions
Authorization: Bearer {token}

# Update permission
PUT /wcm-permissions/:id
Authorization: Bearer {token}

# Delete permission
DELETE /wcm-permissions/:id
Authorization: Bearer {token}
```

### Articles (with Permission Control)

```bash
# Read articles (no auth required)
GET /articles

# Create article (requires article.create permission)
POST /articles
Authorization: Bearer {token}

# Update article (requires article.update permission)
PUT /articles/:id
Authorization: Bearer {token}

# Delete article (requires article.delete permission)
DELETE /articles/:id
Authorization: Bearer {token}
```

## Setup Instructions

### 1. Run Database Script

Execute the [auth-init.sql](auth-init.sql) script in your MySQL database to create tables and sample data.

### 2. Update .env

```env
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=nestjs_db
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=development
PORT=3000
```

### 3. Start the Server

```bash
npm run start:dev
```

### 4. Access Swagger API

Open `http://localhost:3000/api` in your browser

## Default Credentials

The auth-init.sql script creates three sample users:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| admin@example.com | admin123 | admin | All |
| editor@example.com | admin123 | editor | Article management |
| viewer@example.com | admin123 | viewer | Read-only |

**Note**: Default passwords are hashed with bcrypt. To use them, you may need to reset the password through the application interface.

## Usage Examples

### 1. Login and Get Token

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 2. Create Article (with Permission Check)

```bash
curl -X POST http://localhost:3000/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "title": "New Article",
    "content": "Article content here",
    "author": "Admin User"
  }'
```

### 3. Use Decorators for Access Control

In your controller:

```typescript
// Require specific permission
@Post('articles')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions('article.create')
async create(@Body() createArticleDto: CreateArticleDto) {
  // ...
}

// Require specific role
@Get('admin')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('admin')
async adminPanel() {
  // ...
}
```

## Creating Custom Permissions

1. Add permission via API:

```bash
POST /wcm-permissions
Authorization: Bearer {token}
Body: {
  "name": "comment.create",
  "description": "Can create comments",
  "module": "comment",
  "action": "create"
}
```

2. Assign to Role:

Update the wcm_role_permissions table to link the permission to a role.

3. Use in Controller:

```typescript
@Post('comments')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permissions('comment.create')
async createComment() {
  // ...
}
```

## Security Considerations

- **Always change JWT_SECRET** in production
- **Use HTTPS** only in production
- **Hash passwords** with bcrypt (handled automatically)
- **Set appropriate token expiration** based on your needs
- **Implement rate limiting** for login endpoint
- **Log security events** for audit purposes
- **Validate all input** with DTOs and class-validator

## Permission Naming Convention

Format: `{module}.{action}`

Examples:
- `article.create`
- `article.read`
- `article.update`
- `article.delete`
- `user.create`
- `user.read`

## Troubleshooting

### Invalid JWT Token

- Ensure token is passed in Authorization header as `Bearer {token}`
- Check token has not expired (24 hours)
- Verify JWT_SECRET matches between signing and verification

### Permission Denied

- Verify user has required role
- Check role has required permission
- Review permission name format

### User Not Found

- Verify user exists in database
- Check email spelling
- Ensure user is assigned a role

## Future Enhancements

- [ ] Refresh token implementation
- [ ] Two-factor authentication (2FA)
- [ ] OAuth2 integration
- [ ] API key authentication
- [ ] Audit logging
- [ ] Role hierarchy
- [ ] Dynamic permission groups
