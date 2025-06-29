
export interface CustomizationData {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    background: string;
    cardBackground: string;
    headerBackground: string;
    textPrimary: string;
    textSecondary: string;
    textLink: string;
    border: string;
    accent: string;
  };
  typography: {
    headingSize: number;
    bodySize: number;
    smallSize: number;
    headingWeight: number;
    bodyWeight: number;
  };
  components: {
    buttonRadius: number;
    cardRadius: number;
    inputRadius: number;
    profilePictureShape: 'circle' | 'square';
    profilePictureSize: number;
  };
  layout: {
    containerMaxWidth: number;
    pageMargin: number;
    componentSpacing: number;
  };
  icons: {
    size: number;
    color: string;
  };
}
