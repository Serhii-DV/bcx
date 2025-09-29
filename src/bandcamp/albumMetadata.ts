export class AlbumMetadata {
  constructor(
    public label: string,
    public datePublished: Date,
    public dateModified: Date,
    public keywords: string[],
    public credit: string,
    public quality: string,
  ) {}
}
