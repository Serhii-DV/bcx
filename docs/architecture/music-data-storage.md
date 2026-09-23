# Music data storage flows

## Writing music data

Album and track pages provide JSON-LD schema data in the HTML. The content script turns that data into BCX models, then saves compressed records in Chrome local storage.

```mermaid
flowchart TB
    html[Bandcamp album or track page<br/>JSON-LD script]
    schema[Parse JSON and select<br/>MusicAlbum or MusicRecording schema]
    html --> schema

    schema -->|Album page| albumFactory[AlbumFactory and TrackFactory]
    schema -->|Track page| trackFactory[TrackFactory]
    albumFactory --> album[Album with Track objects]
    trackFactory --> track[Track object]

    album --> saveAlbum[BandcampStorage.saveAlbum]
    track --> saveTrack[BandcampStorage.saveTrack]
    saveAlbum --> raw[toRawData: plain fields]
    saveTrack --> raw
    raw --> compressed[Compress: short field names and URLs]
    compressed --> keyed[Keyed records and URL lookups]
    keyed --> wrapper[Storage.set]
    wrapper --> local[chrome.storage.local]
```

`saveAlbum` includes the album and any tracks that are not already stored. An album record keeps track IDs rather than full Track objects. Stored records use `/a/{id}` and `/t/{id}` keys, with URL lookup keys pointing to those records when a URL is available.

This chart covers album and track pages. The artist music page builds band data from page content through a separate path.

## Reading music data

The side panel and content scripts read saved albums and tracks through `BandcampStorage`.

```mermaid
flowchart TB
    request[Side panel or content script requests saved music]
    read[BandcampStorage read methods]
    lookup[Choose an entity ID or saved URL reference]
    get[Storage.get]
    local[chrome.storage.local]
    records[Compressed album and track records]
    expanded[Decompress field names and URLs]
    raw[RawAlbumData or RawTrackData]
    models[Factories rebuild Album and Track objects]
    result[Music data returned to the caller]

    request --> read --> lookup --> get --> local
    local --> records --> expanded --> raw --> models --> result
```

A URL reference requires a first storage lookup to find its entity key. Album reads can then follow stored track IDs, load those track records, and attach the reconstructed Tracks to the Album. Direct track reads rebuild a Track from its compressed record.
