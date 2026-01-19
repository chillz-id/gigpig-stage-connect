// ArticleSchema - JSON-LD Structured Data for SEO
// Generates Review, NewsArticle, or Article schema based on category
// For Stand Up Sydney News CMS template
import { useEffect } from "react"
import { addPropertyControls, ControlType } from "framer"

interface ArticleSchemaProps {
    title: string
    excerpt: string
    slug: string
    featuredImage: string
    category: "reviews" | "news" | "lists" | "interviews"
    tags: string
    rating: number
    authorName: string
    authorBio: string
    authorImage: string
    authorUrl: string
    publishDate: string
    updatedDate: string
}

/**
 * ArticleSchema - Invisible component that injects JSON-LD structured data
 *
 * Add to your News article template page. Connect CMS fields to props.
 * Generates appropriate schema based on category:
 * - reviews: Review + Rating schema (shows stars in Google)
 * - news: NewsArticle schema
 * - lists/interviews: Article schema
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */
export default function ArticleSchema(props: ArticleSchemaProps) {
    const {
        title = "Article Title",
        excerpt = "",
        slug = "article-slug",
        featuredImage = "",
        category = "news",
        tags = "",
        rating = 0,
        authorName = "Stand Up Sydney",
        authorBio = "",
        authorImage = "",
        authorUrl = "",
        publishDate = "",
        updatedDate = "",
    } = props

    const siteUrl = "https://standupsydney.com"
    const siteName = "Stand Up Sydney"
    const logoUrl = "https://standupsydney.com/logo.png"
    const articleUrl = `${siteUrl}/news/${slug}`
    const tagsArray = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : []

    useEffect(() => {
        if (typeof window === "undefined") return

        // Build schemas array
        const schemas: object[] = []

        // Author object
        const authorSchema = {
            "@type": "Person",
            name: authorName,
            ...(authorBio && { description: authorBio }),
            ...(authorImage && { image: authorImage }),
            ...(authorUrl && { url: authorUrl }),
        }

        // Publisher object
        const publisherSchema = {
            "@type": "Organization",
            name: siteName,
            url: siteUrl,
            logo: { "@type": "ImageObject", url: logoUrl },
        }

        // Category-specific schema
        if (category === "reviews" && rating > 0) {
            // Review schema with star rating
            schemas.push({
                "@context": "https://schema.org",
                "@type": "Review",
                name: title,
                reviewBody: excerpt,
                url: articleUrl,
                datePublished: publishDate,
                ...(updatedDate && { dateModified: updatedDate }),
                author: authorSchema,
                publisher: publisherSchema,
                reviewRating: {
                    "@type": "Rating",
                    ratingValue: rating,
                    bestRating: 5,
                    worstRating: 1,
                },
                itemReviewed: {
                    "@type": "CreativeWork",
                    name: title.replace(/Review:?\s*/i, "").trim(),
                },
                ...(featuredImage && { image: { "@type": "ImageObject", url: featuredImage } }),
                ...(tagsArray.length > 0 && { keywords: tagsArray.join(", ") }),
            })
        } else {
            // Article or NewsArticle schema
            schemas.push({
                "@context": "https://schema.org",
                "@type": category === "news" ? "NewsArticle" : "Article",
                headline: title,
                description: excerpt,
                url: articleUrl,
                mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
                datePublished: publishDate,
                ...(updatedDate && { dateModified: updatedDate }),
                author: authorSchema,
                publisher: publisherSchema,
                ...(featuredImage && { image: { "@type": "ImageObject", url: featuredImage } }),
                ...(tagsArray.length > 0 && { keywords: tagsArray.join(", ") }),
            })
        }

        // Breadcrumb schema
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
                { "@type": "ListItem", position: 2, name: "News", item: `${siteUrl}/news` },
                { "@type": "ListItem", position: 3, name: category.charAt(0).toUpperCase() + category.slice(1), item: `${siteUrl}/news/${category}` },
                { "@type": "ListItem", position: 4, name: title, item: articleUrl },
            ],
        })

        // Organization schema
        schemas.push({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteName,
            url: siteUrl,
            logo: logoUrl,
            sameAs: [
                "https://www.facebook.com/standupsydney",
                "https://www.instagram.com/standupsydney",
                "https://twitter.com/standupsydney",
            ],
        })

        // Inject into document head
        const scriptId = "article-schema-jsonld"
        document.getElementById(scriptId)?.remove()

        const script = document.createElement("script")
        script.id = scriptId
        script.type = "application/ld+json"
        script.textContent = JSON.stringify(schemas)
        document.head.appendChild(script)

        return () => {
            document.getElementById(scriptId)?.remove()
        }
    }, [title, excerpt, slug, featuredImage, category, tags, rating, authorName, authorBio, authorImage, authorUrl, publishDate, updatedDate])

    // Render nothing - this is a head-injection component
    return null
}

addPropertyControls(ArticleSchema, {
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
        type: ControlType.Enum,
        title: "Category",
        options: ["reviews", "news", "lists", "interviews"],
        optionTitles: ["Reviews", "News", "Lists", "Interviews"],
        defaultValue: "news",
    },
    tags: {
        type: ControlType.String,
        title: "Tags",
        defaultValue: "",
        placeholder: "Comma-separated tags",
    },
    rating: {
        type: ControlType.Number,
        title: "Rating",
        min: 0,
        max: 5,
        step: 0.5,
        defaultValue: 0,
        displayStepper: true,
    },
    authorName: {
        type: ControlType.String,
        title: "Author Name",
        defaultValue: "Stand Up Sydney",
    },
    authorBio: {
        type: ControlType.String,
        title: "Author Bio",
        defaultValue: "",
        displayTextArea: true,
    },
    authorImage: {
        type: ControlType.String,
        title: "Author Image URL",
        defaultValue: "",
    },
    authorUrl: {
        type: ControlType.String,
        title: "Author URL",
        defaultValue: "",
    },
    publishDate: {
        type: ControlType.String,
        title: "Publish Date (ISO)",
        defaultValue: "",
        placeholder: "2026-01-03T10:00:00Z",
    },
    updatedDate: {
        type: ControlType.String,
        title: "Updated Date (ISO)",
        defaultValue: "",
        placeholder: "Leave empty if same as publish",
    },
})
