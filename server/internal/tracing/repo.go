package tracing

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const ttlDays = 14

type TraceRepo struct {
	coll *mongo.Collection
}

func NewTraceRepo(db *mongo.Database) *TraceRepo {
	return &TraceRepo{coll: db.Collection("traces")}
}

func (r *TraceRepo) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "DeleteAt", Value: 1}},
			Options: options.Index().SetExpireAfterSeconds(0),
		},
		{
			Keys: bson.D{{Key: "UserId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "CreatedAt", Value: -1}},
		},
	}
	_, err := r.coll.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		return fmt.Errorf("create trace indexes: %w", err)
	}
	return nil
}

func (r *TraceRepo) Save(ctx context.Context, event *TraceEvent) (string, error) {
	now := time.Now().UTC()
	event.ID = uuid.NewString()
	event.CreatedAt = now
	event.DeleteAt = now.Add(ttlDays * 24 * time.Hour)

	_, err := r.coll.InsertOne(ctx, event)
	if err != nil {
		return "", fmt.Errorf("insert trace: %w", err)
	}
	return event.ID, nil
}
