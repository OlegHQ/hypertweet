package tracing

import "time"

type TraceEvent struct {
	ID         string    `bson:"_id" json:"id"`
	Type       string    `bson:"type" json:"type"`
	UserID     string    `bson:"userId" json:"userId"`
	Model      string    `bson:"model" json:"model"`
	Prompt     string    `bson:"prompt" json:"prompt"`
	Response   string    `bson:"response" json:"response"`
	TimeTookMs int       `bson:"timeTookMs" json:"timeTookMs"`
	CreatedAt  time.Time `bson:"createdAt" json:"createdAt"`
	DeleteAt   time.Time `bson:"deleteAt" json:"deleteAt"`
}
