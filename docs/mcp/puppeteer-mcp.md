# Puppeteer MCP Server Documentation

## Overview

The Puppeteer MCP server provides browser automation capabilities through the Model Context Protocol, enabling AI assistants to control headless Chrome browsers for web scraping, testing, and automation tasks.

**Official Repository**: [github.com/modelcontextprotocol/server-puppeteer](https://github.com/modelcontextprotocol/server-puppeteer)

## Configuration

In `/root/agents/.mcp.json`:
```json
"puppeteer": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-puppeteer@latest"
  ]
}
```

## Available Tools

### Browser Management
- `launch_browser`: Launch new browser instance
- `close_browser`: Close browser instance
- `get_browser_info`: Get browser version and details
- `set_browser_options`: Configure browser settings

### Page Operations
- `goto_page`: Navigate to URL
- `reload_page`: Reload current page
- `go_back`: Navigate back in history
- `go_forward`: Navigate forward in history
- `get_page_content`: Get page HTML content
- `get_page_title`: Get page title
- `get_page_url`: Get current URL

### Element Interaction
- `click_element`: Click on element
- `type_text`: Type text into input field
- `select_option`: Select option from dropdown
- `hover_element`: Hover over element
- `focus_element`: Focus on element
- `get_element_text`: Get element text content
- `get_element_attribute`: Get element attribute value

### Form Operations
- `fill_form`: Fill form fields
- `submit_form`: Submit form
- `clear_input`: Clear input field
- `upload_file`: Upload file to input

### Screenshot & PDF
- `take_screenshot`: Capture page screenshot
- `take_element_screenshot`: Screenshot specific element
- `generate_pdf`: Generate PDF of page
- `set_viewport`: Set browser viewport size

### JavaScript Execution
- `execute_script`: Execute JavaScript code
- `evaluate_function`: Evaluate JavaScript function
- `add_script_tag`: Add script to page
- `add_style_tag`: Add CSS styles to page

### Network & Cookies
- `intercept_requests`: Intercept network requests
- `set_cookies`: Set browser cookies
- `get_cookies`: Get browser cookies
- `clear_cookies`: Clear browser cookies
- `set_headers`: Set custom headers

## Usage Examples

### Basic Navigation
```javascript
// Launch browser
await puppeteer.launch_browser({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

// Navigate to page
await puppeteer.goto_page({
  url: "https://example.com",
  waitUntil: "networkidle2"
});

// Get page content
const content = await puppeteer.get_page_content();
```

### Element Interaction
```javascript
// Click button
await puppeteer.click_element({
  selector: "#submit-button",
  waitFor: "visible"
});

// Type in input field
await puppeteer.type_text({
  selector: "#username",
  text: "john.doe@example.com"
});

// Get element text
const text = await puppeteer.get_element_text({
  selector: ".result-title"
});
```

### Form Handling
```javascript
// Fill form
await puppeteer.fill_form({
  form_selector: "#contact-form",
  fields: {
    name: "John Doe",
    email: "john@example.com",
    message: "Hello world!"
  }
});

// Submit form
await puppeteer.submit_form({
  form_selector: "#contact-form"
});
```

### Screenshots & PDFs
```javascript
// Take screenshot
await puppeteer.take_screenshot({
  path: "screenshot.png",
  fullPage: true,
  quality: 90
});

// Generate PDF
await puppeteer.generate_pdf({
  path: "page.pdf",
  format: "A4",
  margin: {
    top: "20px",
    right: "20px",
    bottom: "20px",
    left: "20px"
  }
});
```

### JavaScript Execution
```javascript
// Execute JavaScript
const result = await puppeteer.execute_script({
  script: "document.querySelector('h1').textContent"
});

// Evaluate function
const data = await puppeteer.evaluate_function({
  function: "() => { return { title: document.title, url: window.location.href }; }"
});
```

### Network Interception
```javascript
// Intercept requests
await puppeteer.intercept_requests({
  pattern: "*.jpg",
  action: "block"
});

// Set cookies
await puppeteer.set_cookies({
  cookies: [
    {
      name: "session",
      value: "abc123",
      domain: "example.com"
    }
  ]
});
```

## Browser Launch Options

### Headless Mode
```javascript
{
  headless: true,        // Run without GUI
  headless: false,       // Run with GUI
  headless: "new"        // Use new headless mode
}
```

### Performance Options
```javascript
{
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu"
  ]
}
```

### Mobile Emulation
```javascript
{
  defaultViewport: {
    width: 375,
    height: 667,
    isMobile: true,
    hasTouch: true
  }
}
```

## Common Use Cases

1. **Web Scraping**: Extract data from websites
2. **E2E Testing**: Automated testing of web applications
3. **PDF Generation**: Convert web pages to PDF
4. **Screenshot Testing**: Visual regression testing
5. **Form Automation**: Auto-fill and submit forms
6. **Performance Testing**: Monitor page load times
7. **SEO Analysis**: Analyze page structure and content

## Wait Strategies

### Network-based Waiting
- `networkidle0`: No network requests for 500ms
- `networkidle2`: No more than 2 network requests for 500ms
- `load`: Page load event fired
- `domcontentloaded`: DOM content loaded

### Element-based Waiting
- `visible`: Element is visible
- `hidden`: Element is hidden
- `attached`: Element is attached to DOM
- `detached`: Element is detached from DOM

## Error Handling

Common errors and solutions:
- **TimeoutError**: Increase timeout or improve wait conditions
- **ElementNotFound**: Verify selectors and wait for elements
- **NavigationError**: Check URL validity and network connectivity
- **ProtocolError**: Browser connection issues, restart browser
- **LaunchError**: Browser launch failed, check system resources

## Performance Optimization

### Memory Management
- Close unused pages and browsers
- Limit concurrent operations
- Use page pooling for heavy workloads

### Speed Optimization
- Disable images and CSS when not needed
- Use faster selectors (ID > class > complex)
- Implement request filtering
- Use page caching strategically

## Security Considerations

1. **Sandboxing**: Run in sandboxed environment
2. **URL Validation**: Validate URLs before navigation
3. **Script Injection**: Sanitize injected JavaScript
4. **File System Access**: Limit file system operations
5. **Resource Limits**: Set timeouts and resource limits

## Best Practices

1. **Resource Management**: Always close browsers and pages
2. **Error Handling**: Implement comprehensive error handling
3. **Wait Strategies**: Use appropriate wait conditions
4. **Selector Robustness**: Use stable selectors
5. **Performance Monitoring**: Monitor resource usage
6. **Concurrent Limits**: Limit concurrent browser instances

## Related Resources

- [Puppeteer Documentation](https://puppeteer.com)
- [Puppeteer MCP Server Repository](https://github.com/modelcontextprotocol/server-puppeteer)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)