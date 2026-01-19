// ArticleMeta - Open Graph & Twitter Card Meta Tags
// For Stand Up Sydney News CMS template
import { useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

interface ArticleMetaProps {
    title: string
    excerpt: string
    slug: string
    featuredImage: string
    category: string
    tags: string
    authorName: string
    publishDate: string
    updatedDate: string
}

/**
 * ArticleMeta - Invisible component that injects meta tags for social sharing
 *
 * Add to your News article template page. Connect CMS fields to props.
 * Generates Open Graph and Twitter Card meta tags for proper social previews.
 *
 * Note: Framer handles some meta tags automatically. This component
 * adds article-specific Open Graph properties.
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ArticleMeta(props: ArticleMetaProps) {
    const {
        title = "Article Title",
        excerpt = "",
        slug = "article-slug",
        featuredImage = "",
        category = "news",
        tags = "",
        authorName = "Stand Up Sydney",
        publishDate = "",
        updatedDate = "",
    } = props

    const siteUrl = "https://standupsydney.com"
    const siteName = "Stand Up Sydney"
    const articleUrl = `${siteUrl}/news/${slug}`
    const tagsArray = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : []

    useEffect(() => {
        if (typeof window === "undefined") return

        // Meta tags to inject
        const metaTags: { property?: string; name?: string; content: string }[] = [
            // Open Graph
            { property: "og:type", content: "article" },
            { property: "og:title", content: title },
            { property: "og:description", content: excerpt },
            { property: "og:url", content: articleUrl },
            { property: "og:site_name", content: siteName },
            ...(featuredImage ? [{ property: "og:image", content: featuredImage }] : []),
            ...(publishDate ? [{ property: "article:published_time", content: publishDate }] : []),
            ...(updatedDate ? [{ property: "article:modified_time", content: updatedDate }] : []),
            { property: "article:section", content: category },
            ...tagsArray.map(tag => ({ property: "article:tag", content: tag })),

            // Twitter Card
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: title },
            { name: "twitter:description", content: excerpt },
            ...(featuredImage ? [{ name: "twitter:image", content: featuredImage }] : []),

            // General
            { name: "author", content: authorName },
        ]

        // Create unique IDs for cleanup
        const metaIds: string[] = []

        metaTags.forEach((tag, index) => {
            const id = `article-meta-${index}`
            metaIds.push(id)

            // Remove existing if present
            document.getElementById(id)?.remove()

            // Create meta element
            const meta = document.createElement("meta")
            meta.id = id
            if (tag.property) meta.setAttribute("property", tag.property)
            if (tag.name) meta.setAttribute("name", tag.name)
            meta.setAttribute("content", tag.content)
            document.head.appendChild(meta)
        })

        // Add canonical link
        const canonicalId = "article-canonical"
        document.getElementById(canonicalId)?.remove()
        const canonical = document.createElement("link")
        canonical.id = canonicalId
        canonical.rel = "canonical"
        canonical.href = articleUrl
        document.head.appendChild(canonical)

        return () => {
            metaIds.forEach(id => document.getElementById(id)?.remove())
            document.getElementById(canonicalId)?.remove()
        }
    }, [title, excerpt, slug, featuredImage, category, tags, authorName, publishDate, updatedDate])

    // Render nothing - this is a head-injection component
    return null
}

addPropertyControls(ArticleMeta, {
    title: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Article Title",
    },
    excerpt: {
        type: ControlType.String,
        title: "Excerpt",
        defaultValue: "",
        displayTextArea: true,
    },
    slug: {
        type: ControlType.String,
        title: "Slug",
        defaultValue: "article-slug",
    },
    featuredImage: {
        type: ControlType.String,
        title: "Featured Image URL",
        defaultValue: "",
    },
    category: {
        type: ControlType.String,
        title: "Category",
        defaultValue: "news",
    },
    tags: {
        type: ControlType.String,
        title: "Tags",
        defaultValue: "",
        placeholder: "Comma-separated tags",
    },
    authorName: {
        type: ControlType.String,
        title: "Author Name",
        defaultValue: "Stand Up Sydney",
    },
    publishDate: {
        type: ControlType.String,
        title: "Publish Date (ISO)",
        defaultValue: "",
    },
    updatedDate: {
        type: ControlType.String,
        title: "Updated Date (ISO)",
        defaultValue: "",
    },
})
