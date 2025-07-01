
export interface DesignSystemSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    muted: string;
    'muted-foreground': string;
    border: string;
    input: string;
    'primary-foreground': string;
    'secondary-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    success: string;
    'success-foreground': string;
    warning: string;
    'warning-foreground': string;
  };
  buttons: {
    borderRadius: number;
    borderWidth: number;
    paddingX: number;
    paddingY: number;
    fontSize: number;
    fontWeight: number;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    h1Size: number;
    h2Size: number;
    h3Size: number;
    bodySize: number;
    smallSize: number;
    lineHeight: number;
    letterSpacing: number;
  };
  layout: {
    containerMaxWidth: number;
    sectionPadding: number;
    cardSpacing: number;
    gridGap: number;
  };
  effects: {
    shadowIntensity: number;
    blurIntensity: number;
    animationSpeed: string;
    hoverScale: number;
  };
}
