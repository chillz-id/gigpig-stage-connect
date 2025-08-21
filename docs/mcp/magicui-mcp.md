# Magic UI MCP Server Documentation

## Overview

The Magic UI MCP server provides access to a comprehensive library of modern React components and design patterns through the Model Context Protocol, enabling AI assistants to generate beautiful UI components quickly.

**Official Repository**: [github.com/magicuidesign/mcp-server](https://github.com/magicuidesign/mcp-server)

## Configuration

In `/root/agents/.mcp.json`:
```json
"@magicuidesign/mcp": {
  "command": "npx",
  "args": ["-y", "@magicuidesign/mcp@latest"]
}
```

## Available Tools

### Component Library
- `list_components`: List available UI components
- `get_component`: Get component code and documentation
- `search_components`: Search components by category or name
- `get_component_variants`: Get component variations

### Design System
- `get_design_tokens`: Get design system tokens
- `list_themes`: List available themes
- `get_theme`: Get theme configuration
- `apply_theme`: Apply theme to components

### Code Generation
- `generate_component`: Generate custom component
- `combine_components`: Combine multiple components
- `customize_component`: Customize existing component
- `export_component`: Export component code

### Documentation
- `get_documentation`: Get component documentation
- `get_examples`: Get usage examples
- `get_best_practices`: Get implementation best practices

## Usage Examples

### Component Discovery
```javascript
// List all components
const components = await magicui.list_components({
  category: "all"
});

// Search for specific components
const buttons = await magicui.search_components({
  query: "button",
  category: "interactive"
});

// Get component details
const buttonComponent = await magicui.get_component({
  name: "animated-button",
  variant: "primary"
});
```

### Component Generation
```javascript
// Generate custom component
const customButton = await magicui.generate_component({
  type: "button",
  style: "gradient",
  animation: "hover-scale",
  size: "medium"
});

// Combine components
const card = await magicui.combine_components({
  components: ["card", "button", "avatar"],
  layout: "vertical",
  spacing: "medium"
});
```

### Design System Integration
```javascript
// Get design tokens
const tokens = await magicui.get_design_tokens({
  category: "colors"
});

// Apply theme
const themedComponent = await magicui.apply_theme({
  component: "button",
  theme: "dark-mode",
  variant: "primary"
});
```

### Documentation and Examples
```javascript
// Get component documentation
const docs = await magicui.get_documentation({
  component: "data-table",
  include_examples: true
});

// Get usage examples
const examples = await magicui.get_examples({
  component: "form",
  framework: "react",
  complexity: "advanced"
});
```

## Component Categories

### Layout Components
- **Grid**: Responsive grid systems
- **Flex**: Flexible layout containers
- **Stack**: Vertical/horizontal stacking
- **Container**: Page containers
- **Spacer**: Spacing utilities

### Interactive Components
- **Button**: Various button styles
- **Input**: Form input fields
- **Select**: Dropdown selectors
- **Checkbox**: Checkboxes and switches
- **Slider**: Range sliders

### Data Display
- **Table**: Data tables with sorting/filtering
- **List**: Various list layouts
- **Card**: Content cards
- **Badge**: Status badges
- **Avatar**: User avatars

### Navigation
- **Menu**: Navigation menus
- **Breadcrumb**: Breadcrumb navigation
- **Tabs**: Tab navigation
- **Pagination**: Page navigation
- **Sidebar**: Side navigation

### Feedback
- **Alert**: Alert messages
- **Toast**: Toast notifications
- **Modal**: Modal dialogs
- **Tooltip**: Hover tooltips
- **Progress**: Progress indicators

### Advanced Components
- **Chart**: Data visualization
- **Calendar**: Date picker/calendar
- **File Upload**: File upload interfaces
- **Rich Text**: Text editors
- **Code Block**: Code display

## Animation Features

### Built-in Animations
- **Fade**: Fade in/out effects
- **Slide**: Slide transitions
- **Scale**: Scale animations
- **Rotate**: Rotation effects
- **Bounce**: Bounce animations

### Custom Animations
- **Keyframes**: Custom keyframe animations
- **Transitions**: Smooth transitions
- **Hover Effects**: Interactive hover states
- **Loading States**: Loading animations

## Styling Options

### CSS Framework Support
- **Tailwind CSS**: Full Tailwind integration
- **Styled Components**: CSS-in-JS support
- **CSS Modules**: Module-based styling
- **Emotion**: Emotion styling library

### Customization
- **Color Schemes**: Custom color palettes
- **Typography**: Font and text styling
- **Spacing**: Consistent spacing system
- **Borders**: Border radius and styles

## Component Props

### Common Props
```typescript
interface ComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}
```

### Animation Props
```typescript
interface AnimationProps {
  animate?: boolean;
  duration?: number;
  delay?: number;
  easing?: string;
  onAnimationComplete?: () => void;
}
```

## Theme Configuration

### Color Tokens
```javascript
{
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    900: '#1e3a8a'
  },
  secondary: {
    50: '#fafafa',
    500: '#64748b',
    900: '#0f172a'
  }
}
```

### Typography Scale
```javascript
{
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem'
  }
}
```

## Best Practices

### Component Usage
1. **Consistent Sizing**: Use standard size variants
2. **Accessibility**: Include proper ARIA attributes
3. **Performance**: Optimize for rendering performance
4. **Responsive**: Ensure mobile responsiveness
5. **Theming**: Use consistent theming

### Code Organization
1. **Component Structure**: Organize components logically
2. **Prop Validation**: Validate props properly
3. **Error Handling**: Handle edge cases
4. **Testing**: Write component tests
5. **Documentation**: Document component usage

## Integration Examples

### Next.js Integration
```javascript
import { Button, Card } from '@magicuidesign/components';

export default function HomePage() {
  return (
    <Card className="p-6">
      <Button variant="primary" size="large">
        Get Started
      </Button>
    </Card>
  );
}
```

### TypeScript Support
```typescript
import { ComponentProps } from '@magicuidesign/components';

interface CustomButtonProps extends ComponentProps<'button'> {
  variant: 'primary' | 'secondary';
  loading?: boolean;
}
```

## Performance Considerations

### Bundle Size
- Tree-shaking support
- Individual component imports
- Optimized bundle sizes
- Lazy loading support

### Runtime Performance
- Optimized rendering
- Minimal re-renders
- Efficient animations
- Memory management

## Common Use Cases

1. **Rapid Prototyping**: Quick UI prototypes
2. **Design Systems**: Consistent component libraries
3. **Landing Pages**: Modern landing page components
4. **Dashboards**: Admin dashboard components
5. **E-commerce**: Product page components
6. **Blog Layouts**: Content-focused layouts

## Error Handling

Common errors and solutions:
- **Component Not Found**: Check component name
- **Theme Error**: Verify theme configuration
- **Style Conflicts**: Check CSS specificity
- **Animation Issues**: Validate animation props
- **Props Validation**: Check required props

## Related Resources

- [Magic UI Documentation](https://magicui.design)
- [Magic UI MCP Server Repository](https://github.com/magicuidesign/mcp-server)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Component Examples](https://magicui.design/components)