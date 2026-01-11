package ai

type PageUser struct {
	UserName   *string `json:"userName,omitempty"`
	Email      *string `json:"email,omitempty"`
	Name       *string `json:"name,omitempty"`
	IsVerified *bool   `json:"isVerified,omitempty"`
	Bio        *string `json:"bio,omitempty"`
	Location   *string `json:"location,omitempty"`
	Website    *string `json:"website,omitempty"`
	JoinDate   *string `json:"joinDate,omitempty"`
	Following  *int    `json:"following,omitempty"`
	Followers  *int    `json:"followers,omitempty"`
}

type Post struct {
	Author            PageUser `json:"author"`
	Text              string   `json:"text"`
	CurrentReplyDraft *string  `json:"currentReplyDraft,omitempty"`
	Replies           []Post   `json:"replies,omitempty"`
	Time              *string  `json:"time,omitempty"`
	StatusID          *string  `json:"statusId,omitempty"`
	Url               *string  `json:"url,omitempty"`
	Upvotes           *int     `json:"upvotes,omitempty"`
	CommentCount      *int     `json:"commentCount,omitempty"`
	IsTopLevel        *bool    `json:"isTopLevel,omitempty"`
}

type Page struct {
	Site       string `json:"site"`
	Url        string `json:"url"`
	Posts      []Post `json:"posts"`
	ActivePost *Post  `json:"activePost,omitempty"`
}

type ReplyRequest struct {
	ToneID string `json:"toneId"`
	Page   Page   `json:"page"`
}

type RefineRequest struct {
	Platform          string `json:"platform"`
	OriginalPost      string `json:"originalPost"`
	DraftReply        string `json:"draftReply"`
	RefineInstruction string `json:"refineInstruction"`
}

type ChatMessageReq struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages    []ChatMessageReq `json:"messages"`
	PageContext Page             `json:"pageContext"`
}

type ReplyResponse struct {
	EventID string `json:"eventId"`
	Reply   string `json:"reply"`
}

type Message struct {
	Role    string
	Content string
}
