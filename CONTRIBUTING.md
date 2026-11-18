# Coding Standards

## Error Monitoring with Sentry

Use Sentry to report unexpected failures or abnormal application states that
should not normally occur.

### General rule

> If this state is possible according to the API, handle it normally.
> If this state should not happen according to our application logic, report it to Sentry.

Examples:

- A user requests a product that does not exist → normal `404`
- A request reaches product search without a required `productName` → report to Sentry
- An unexpected database/API failure → report to Sentry as an error

## `Sentry.captureMessage`

Use `Sentry.captureMessage` for handled but abnormal application states that
we want visibility of.

### Convention

Each captured message should follow this structure:

- `message` → static `snake_case` identifier describing what happened
- `level` → severity of the event
- `module` → module responsible for the event
- `extra` → dynamic information useful for debugging

### Template

```typescript
Sentry.captureMessage('event_name', {
  level: 'warning',
  tags: {
    module: 'module_name',
  },
  extra: {
    // debugging context
  },
});
```

### Example

```typescript
if (!productName) {
  Sentry.captureMessage('product_name_missing', {
    level: 'warning',
    tags: {
      module: 'webpage',
    },
    extra: {
      productName,
    },
  });

  throw new NotFoundException('product_name_missing');
}
```

### Keep messages static

Do not put dynamic values directly into the Sentry message.

```typescript
// ❌ Avoid
Sentry.captureMessage(`Product ${productName} was not found`);
```

Instead, keep the event name stable and put dynamic information in `extra`.

```typescript
// ✅ Prefer
Sentry.captureMessage('product_not_found', {
  level: 'warning',
```
