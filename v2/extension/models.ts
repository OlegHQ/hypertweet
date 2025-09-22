export class Page {
	baseHost: string;
	url: string;
	posts?: Post[];
	activePost?: Post;
}

export class User {
	userName?: string;
	email?: string;
	name?: string;
	isVerified?: boolean;
	bio?: string;
	location?: string;
	website?: string;
	joinDate?: string;
	following?: number;
	followers?: number;
}

export class Post {
	author: User;
	text: string;
	replies?: Post[];
	time?: string;
	statusID?: string;
	url?: string;
	upvotes?: number;
	commentCount?: number;
	isTopLevel?: boolean;
}


