package tracing

import "time"

type TraceEvent struct {
	ID         string    `bson:"_id" json:"id"`
	Type       string    `bson:"Type" json:"type"`
	UserID     string    `bson:"UserId" json:"userId"`
	Model      string    `bson:"Model" json:"model"`
	Prompt     string    `bson:"Prompt" json:"prompt"`
	Response   string    `bson:"Response" json:"response"`
	TimeTookMs int       `bson:"TimeTookMs" json:"timeTookMs"`
	CreatedAt  time.Time `bson:"CreatedAt" json:"createdAt"`
	DeleteAt   time.Time `bson:"DeleteAt" json:"deleteAt"`
}
