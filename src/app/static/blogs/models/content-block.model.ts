export interface ContentBlock {
  type: string;
  text: string;
}

export interface BlogContent {
  blocks: ContentBlock[];
}
