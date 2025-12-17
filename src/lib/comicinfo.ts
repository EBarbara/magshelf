import { XMLParser } from 'fast-xml-parser';

export interface ComicInfo {
    Title?: string;
    Series?: string;
    Number?: string;
    Volume?: number;
    Summary?: string;
    Year?: number;
    Month?: number;
    Writer?: string;
    Penciller?: string;
    Inker?: string;
    Colorist?: string;
    Letterer?: string;
    CoverArtist?: string;
    Editor?: string;
    Publisher?: string;
    PageCount?: number;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
});

export function parseComicInfo(xmlContent: string): ComicInfo | null {
    try {
        const result = parser.parse(xmlContent);
        if (result && result.ComicInfo) {
            // fast-xml-parser might parse numbers as strings if not configured otherwise, 
            // but we can cast or let JS handle loose types for now.
            // Let's ensure basic types if possible.
            const info = result.ComicInfo;

            return {
                Title: info.Title,
                Series: info.Series,
                Number: info.Number?.toString(), // Ensure string
                Volume: info.Volume ? Number(info.Volume) : undefined,
                Summary: info.Summary,
                Year: info.Year ? Number(info.Year) : undefined,
                Month: info.Month ? Number(info.Month) : undefined,
                Writer: info.Writer,
                Penciller: info.Penciller,
                Inker: info.Inker,
                Colorist: info.Colorist,
                Letterer: info.Letterer,
                CoverArtist: info.CoverArtist,
                Editor: info.Editor,
                Publisher: info.Publisher,
                PageCount: info.PageCount ? Number(info.PageCount) : undefined,
            };
        }
    } catch (e) {
        console.error("Failed to parse ComicInfo.xml", e);
    }
    return null;
}
