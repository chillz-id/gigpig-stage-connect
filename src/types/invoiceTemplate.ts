export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'classic' | 'minimal' | 'professional';
  layout: 'standard' | 'two-column' | 'detailed' | 'compact';
  preview: string; // Base64 image or URL
  brandingOptions: BrandingOptions;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingOptions {
  logo?: {
    url: string;
    position: 'top-left' | 'top-center' | 'top-right';
    size: 'small' | 'medium' | 'large';
    maxWidth: number;
    maxHeight: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  header: {
    showCompanyInfo: boolean;
    showLogo: boolean;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
  footer: {
    showFooter: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
  };
  layout: {
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    pageSize: 'A4' | 'Letter' | 'Legal';
    orientation: 'portrait' | 'landscape';
  };
}

export interface TemplateSettings {
  selectedTemplateId: string;
  customBranding: Partial<BrandingOptions>;
  userPreferences: {
    defaultTemplate: string;
    autoSave: boolean;
    showPreview: boolean;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
      website?: string;
      abn?: string;
      logo?: string;
    };
  };
}

export interface InvoiceTemplateConfig {
  template: InvoiceTemplate;
  branding: BrandingOptions;
  customizations: {
    showLineNumbers: boolean;
    showItemCodes: boolean;
    showDiscounts: boolean;
    showTaxBreakdown: boolean;
    showPaymentTerms: boolean;
    showNotes: boolean;
    currency: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    numberFormat: 'standard' | 'comma' | 'space';
  };
}

export const DEFAULT_BRANDING_OPTIONS: BrandingOptions = {
  colors: {
    primary: '#7C3AED',
    secondary: '#A855F7',
    accent: '#C084FC',
    text: '#1F2937',
    background: '#FFFFFF',
    border: '#E5E7EB',
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    accent: 'Inter, sans-serif',
  },
  header: {
    showCompanyInfo: true,
    showLogo: true,
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    borderColor: '#E5E7EB',
  },
  footer: {
    showFooter: true,
    text: 'Thank you for your business with Stand Up Sydney',
    backgroundColor: '#F9FAFB',
    textColor: '#6B7280',
    borderColor: '#E5E7EB',
  },
  layout: {
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 20,
    marginRight: 20,
    pageSize: 'A4',
    orientation: 'portrait',
  },
};

export const TEMPLATE_CATEGORIES = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary designs with clean lines and bold typography',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional invoice layouts with professional styling',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple, clean designs focusing on essential information',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Corporate-style templates for business communications',
  },
] as const;

export const DEFAULT_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'modern-gradient',
    name: 'Modern Gradient',
    description: 'Clean modern design with gradient header and professional styling',
    category: 'modern',
    layout: 'standard',
    preview: '',
    brandingOptions: {
      ...DEFAULT_BRANDING_OPTIONS,
      colors: {
        ...DEFAULT_BRANDING_OPTIONS.colors,
        primary: '#7C3AED',
        secondary: '#A855F7',
      },
      header: {
        ...DEFAULT_BRANDING_OPTIONS.header,
        backgroundColor: 'linear-gradient(135deg, #7C3AED, #A855F7)',
        textColor: '#FFFFFF',
      },
    },
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'Traditional business invoice with clean typography and structured layout',
    category: 'classic',
    layout: 'standard',
    preview: '',
    brandingOptions: {
      ...DEFAULT_BRANDING_OPTIONS,
      colors: {
        ...DEFAULT_BRANDING_OPTIONS.colors,
        primary: '#1F2937',
        secondary: '#374151',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    description: 'Simple, uncluttered design focusing on essential information',
    category: 'minimal',
    layout: 'compact',
    preview: '',
    brandingOptions: {
      ...DEFAULT_BRANDING_OPTIONS,
      colors: {
        ...DEFAULT_BRANDING_OPTIONS.colors,
        primary: '#6B7280',
        secondary: '#9CA3AF',
      },
      header: {
        ...DEFAULT_BRANDING_OPTIONS.header,
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#E5E7EB',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comedy-branded',
    name: 'Stand Up Sydney',
    description: 'Branded template with Stand Up Sydney colors and styling',
    category: 'professional',
    layout: 'two-column',
    preview: '',
    brandingOptions: {
      ...DEFAULT_BRANDING_OPTIONS,
      colors: {
        ...DEFAULT_BRANDING_OPTIONS.colors,
        primary: '#DC2626',
        secondary: '#7C3AED',
        accent: '#F59E0B',
      },
      header: {
        ...DEFAULT_BRANDING_OPTIONS.header,
        backgroundColor: 'linear-gradient(135deg, #DC2626, #7C3AED)',
        textColor: '#FFFFFF',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];