# Shared Components Library

Reusable UI components for the TSS application.

## Components

### Button

A versatile button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean (default: false)
- `type`: 'button' | 'submit' | 'reset' (default: 'button')
- `fullWidth`: boolean (default: false)
- `loading`: boolean (default: false)

**Example:**
```svelte
<Button variant="primary" size="md" on:click={handleClick}>
  Click Me
</Button>
```

### Card

A card component for displaying content in a contained format.

**Props:**
- `title`: string | undefined
- `subtitle`: string | undefined
- `variant`: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' (default: 'default')
- `padding`: 'none' | 'sm' | 'md' | 'lg' (default: 'md')
- `collapsible`: boolean (default: false)
- `collapsed`: boolean (default: false)

**Slots:**
- Default slot: Card body content
- `footer`: Footer content

**Example:**
```svelte
<Card title="My Card" variant="primary" collapsible>
  <p>Card content here</p>
  <svelte:fragment slot="footer">
    <Button>Action</Button>
  </svelte:fragment>
</Card>
```

### FormInput

A form input component with label, validation, and help text support.

**Props:**
- `label`: string | undefined
- `id`: string | undefined (auto-generated if not provided)
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' (default: 'text')
- `value`: string | number (bindable)
- `placeholder`: string (default: '')
- `disabled`: boolean (default: false)
- `required`: boolean (default: false)
- `error`: string | undefined
- `helpText`: string | undefined
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

**Example:**
```svelte
<FormInput
  label="Email"
  type="email"
  bind:value={email}
  error={emailError}
  helpText="Enter your email address"
  required
/>
```

### Select

A select/dropdown component with label, validation, and help text support.

**Props:**
- `label`: string | undefined
- `id`: string | undefined (auto-generated if not provided)
- `value`: string | number (bindable)
- `options`: Array<{ value: string | number; label: string }>
- `placeholder`: string (default: '')
- `disabled`: boolean (default: false)
- `required`: boolean (default: false)
- `error`: string | undefined
- `helpText`: string | undefined
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

**Example:**
```svelte
<Select
  label="Choose an option"
  bind:value={selectedValue}
  options={[
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' }
  ]}
  error={selectError}
/>
```

### Textarea

A textarea component with label, validation, and help text support.

**Props:**
- `label`: string | undefined
- `id`: string | undefined (auto-generated if not provided)
- `value`: string (bindable)
- `placeholder`: string (default: '')
- `disabled`: boolean (default: false)
- `required`: boolean (default: false)
- `error`: string | undefined
- `helpText`: string | undefined
- `rows`: number (default: 3)
- `resize`: 'none' | 'both' | 'vertical' | 'horizontal' (default: 'vertical')

**Example:**
```svelte
<Textarea
  label="Description"
  bind:value={description}
  rows={5}
  resize="vertical"
  error={descriptionError}
/>
```

### Modal

A modal/dialog component with backdrop and keyboard support.

**Props:**
- `open`: boolean (bindable, default: false)
- `title`: string (default: '')
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `closeOnBackdrop`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)

**Events:**
- `close`: Dispatched when modal should close

**Slots:**
- Default slot: Modal body content
- `footer`: Footer content with action buttons

**Example:**
```svelte
<Modal bind:open={isOpen} title="Confirm Action" size="md">
  <p>Are you sure you want to proceed?</p>
  <svelte:fragment slot="footer">
    <Button variant="secondary" on:click={() => isOpen = false}>Cancel</Button>
    <Button variant="primary" on:click={handleConfirm}>Confirm</Button>
  </svelte:fragment>
</Modal>
```

### ErrorBoundary

An error boundary component that catches and displays errors.

**Props:**
- `fallback`: Component or message to display on error

**Example:**
```svelte
<ErrorBoundary fallback="Something went wrong">
  <MyComponent />
</ErrorBoundary>
```

## Usage

Import components from the shared components library:

```typescript
import { Button, Card, FormInput, Modal, Select, Textarea } from '$lib/presentation/components/shared';
```

## Accessibility

All components follow accessibility best practices:
- Proper ARIA attributes
- Keyboard navigation support
- Focus management
- Screen reader support

