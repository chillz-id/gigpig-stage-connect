import {
    type FieldDataInput,
    framer,
    type ManagedCollection,
    type ManagedCollectionFieldInput,
    type ManagedCollectionItemInput,
    type ProtectedMethod,
} from "framer-plugin"

export const PLUGIN_KEYS = {
    DATA_SOURCE_ID: "dataSourceId",
    SLUG_FIELD_ID: "slugFieldId",
    SUPABASE_URL: "supabaseUrl",
    SUPABASE_ANON_KEY: "supabaseAnonKey",
} as const

export interface DataSource {
    id: string
    fields: readonly ManagedCollectionFieldInput[]
    items: FieldDataInput[]
}

export const dataSourceOptions = [
    { id: "events", name: "Events" },
] as const

// Supabase configuration
const SUPABASE_URL = "https://pdikjpfulhhpqpxzpgtu.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkaWtqcGZ1bGhocHFweHpwZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNjY4NjEsImV4cCI6MjA2NTg0Mjg2MX0.5L8mD4I3MP22p8bcGUFo6EiVHesfvahfYpPPXjGdy54"

/**
 * Event field definitions for Framer CMS
 */
const EVENT_FIELDS: ManagedCollectionFieldInput[] = [
    { id: "slug", name: "Slug", type: "string" },
    { id: "event_name", name: "Title", type: "string" },
    { id: "description", name: "Description", type: "formattedText" },
    { id: "banner_image_url", name: "Banner Image", type: "image" },
    { id: "venue_name", name: "Venue Name", type: "string" },
    { id: "venue_address", name: "Venue Address", type: "string" },
    { id: "url_tickets_popup", name: "Ticket URL", type: "link" },
    { id: "tags", name: "Tags", type: "string" },
    { id: "session_start", name: "Next Show Date", type: "date" },
]

/**
 * Fetch events from Supabase session_complete view
 */
async function fetchEventsFromSupabase(abortSignal?: AbortSignal): Promise<any[]> {
    const viewResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/session_complete?is_past=eq.false&order=slug.asc,session_start.asc&select=slug,event_name,description,banner_image_url,venue_name,venue_address,url_tickets_popup,tags,session_start`,
        {
            headers: {
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            },
            signal: abortSignal,
        }
    )

    if (!viewResponse.ok) {
        throw new Error(`Failed to fetch events: ${viewResponse.statusText}`)
    }

    const allEvents = await viewResponse.json()

    // Deduplicate by slug, keeping first occurrence (earliest session)
    const seenSlugs = new Set<string>()
    return allEvents.filter((event: any) => {
        if (seenSlugs.has(event.slug)) return false
        seenSlugs.add(event.slug)
        return true
    })
}

/**
 * Convert description to formatted text HTML
 */
function formatDescription(description: string | null): string {
    if (!description) return "<p></p>"

    // If already contains HTML tags, return as-is
    if (description.includes("<p>") || description.includes("<div>")) {
        return description
    }

    // Convert plain text to paragraphs
    const paragraphs = description
        .split("\n\n")
        .map(para => `<p>${para.replace(/\n/g, "<br>")}</p>`)
        .join("")

    return paragraphs || "<p></p>"
}

/**
 * Convert tags array to comma-separated string
 */
function formatTags(tags: string[] | string | null): string {
    if (!tags) return ""
    if (typeof tags === "string") return tags
    return tags.join(", ")
}

/**
 * Retrieve data from Supabase and process it into a structured format.
 */
export async function getDataSource(dataSourceId: string, abortSignal?: AbortSignal): Promise<DataSource> {
    if (dataSourceId !== "events") {
        throw new Error(`Unknown data source: ${dataSourceId}`)
    }

    const events = await fetchEventsFromSupabase(abortSignal)

    // Transform events into Framer CMS format
    const items: FieldDataInput[] = events.map(event => ({
        slug: { type: "string" as const, value: event.slug },
        event_name: { type: "string" as const, value: event.event_name || "" },
        description: { type: "formattedText" as const, value: formatDescription(event.description) },
        banner_image_url: { type: "image" as const, value: event.banner_image_url || null },
        venue_name: { type: "string" as const, value: event.venue_name || "" },
        venue_address: { type: "string" as const, value: event.venue_address || "" },
        url_tickets_popup: { type: "link" as const, value: event.url_tickets_popup || null },
        tags: { type: "string" as const, value: formatTags(event.tags) },
        session_start: { type: "date" as const, value: event.session_start || null },
    }))

    return {
        id: "events",
        fields: EVENT_FIELDS,
        items,
    }
}

export function mergeFieldsWithExistingFields(
    sourceFields: readonly ManagedCollectionFieldInput[],
    existingFields: readonly ManagedCollectionFieldInput[]
): ManagedCollectionFieldInput[] {
    return sourceFields.map(sourceField => {
        const existingField = existingFields.find(existingField => existingField.id === sourceField.id)
        if (existingField) {
            return { ...sourceField, name: existingField.name }
        }
        return sourceField
    })
}

export async function syncCollection(
    collection: ManagedCollection,
    dataSource: DataSource,
    fields: readonly ManagedCollectionFieldInput[],
    slugField: ManagedCollectionFieldInput
) {
    const items: ManagedCollectionItemInput[] = []
    const unsyncedItems = new Set(await collection.getItemIds())

    for (let i = 0; i < dataSource.items.length; i++) {
        const item = dataSource.items[i]
        if (!item) throw new Error("Logic error")

        const slugValue = item[slugField.id]
        if (!slugValue || typeof slugValue.value !== "string") {
            console.warn(`Skipping item at index ${i} because it doesn't have a valid slug`)
            continue
        }

        unsyncedItems.delete(slugValue.value)

        const fieldData: FieldDataInput = {}
        for (const [fieldName, value] of Object.entries(item)) {
            const field = fields.find(field => field.id === fieldName)

            // Field is in the data but skipped based on selected fields.
            if (!field) continue

            // For details on expected field value, see:
            // https://www.framer.com/developers/plugins/cms#collections
            fieldData[field.id] = value
        }

        items.push({
            id: slugValue.value,
            slug: slugValue.value,
            draft: false,
            fieldData,
        })
    }

    await collection.removeItems(Array.from(unsyncedItems))
    await collection.addItems(items)

    await collection.setPluginData(PLUGIN_KEYS.DATA_SOURCE_ID, dataSource.id)
    await collection.setPluginData(PLUGIN_KEYS.SLUG_FIELD_ID, slugField.id)
}

export const syncMethods = [
    "ManagedCollection.removeItems",
    "ManagedCollection.addItems",
    "ManagedCollection.setPluginData",
] as const satisfies ProtectedMethod[]

export async function syncExistingCollection(
    collection: ManagedCollection,
    previousDataSourceId: string | null,
    previousSlugFieldId: string | null
): Promise<{ didSync: boolean }> {
    if (!previousDataSourceId) {
        return { didSync: false }
    }

    if (framer.mode !== "syncManagedCollection" || !previousSlugFieldId) {
        return { didSync: false }
    }

    if (!framer.isAllowedTo(...syncMethods)) {
        return { didSync: false }
    }

    try {
        const dataSource = await getDataSource(previousDataSourceId)
        const existingFields = await collection.getFields()

        const slugField = dataSource.fields.find(field => field.id === previousSlugFieldId)
        if (!slugField) {
            framer.notify(`No field matches the slug field id "${previousSlugFieldId}". Sync will not be performed.`, {
                variant: "error",
            })
            return { didSync: false }
        }

        await syncCollection(collection, dataSource, existingFields, slugField)
        return { didSync: true }
    } catch (error) {
        console.error(error)
        framer.notify(`Failed to sync collection "${previousDataSourceId}". Check browser console for more details.`, {
            variant: "error",
        })
        return { didSync: false }
    }
}
