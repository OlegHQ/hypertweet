package inbox

import (
	"time"

	"github.com/hypertweet/server/internal/ai"
)

const (
	StatusUnreplied = "unreplied"
	StatusFinished  = "finished"
)

type ReplyVariant struct {
	ID        string    `bson:"Id" json:"id"`
	Text      string    `bson:"Text" json:"text"`
	Source    string    `bson:"Source" json:"source"`
	CreatedAt time.Time `bson:"CreatedAt" json:"createdAt"`
}

type SavedItem struct {
	ID            string         `bson:"_id" json:"id"`
	UserID        string         `bson:"UserId" json:"userId"`
	Key           string         `bson:"Key" json:"key"`
	Status        string         `bson:"Status" json:"status"`
	Page          ai.Page        `bson:"Page" json:"page"`
	ReplyVariants []ReplyVariant `bson:"ReplyVariants" json:"replyVariants"`
	CreatedAt     time.Time      `bson:"CreatedAt" json:"createdAt"`
	UpdatedAt     time.Time      `bson:"UpdatedAt" json:"updatedAt"`
}

type ItemSummary struct {
	ID           string    `json:"id"`
	Key          string    `json:"key"`
	Status       string    `json:"status"`
	Site         string    `json:"site"`
	Url          string    `json:"url"`
	TextPreview  string    `json:"textPreview"`
	VariantCount int       `json:"variantCount"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
