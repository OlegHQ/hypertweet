interface PostReply { postText: string, authorName: string | null, authorUsername: string | null };

export interface PostContent {
	authorName: string | null;
	authorUsername: string | null;
	postText: string;
	replies: PostReply[]
	currentReply: string | null;
}
