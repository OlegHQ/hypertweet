package apitokens

import (
	"context"
	"errors"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repo struct {
	coll *mongo.Collection
}

func NewRepo(db *mongo.Database) *Repo {
	return &Repo{coll: db.Collection("apiTokens")}
}

func (r *Repo) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "UserId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "TokenHash", Value: 1}},
			Options: options.Index().
				SetUnique(true).
				SetPartialFilterExpression(bson.M{"TokenHash": bson.M{"$type": "string"}}),
		},
	}
	_, err := r.coll.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		return fmt.Errorf("create api token indexes: %w", err)
	}
	return nil
}

func (r *Repo) Insert(ctx context.Context, token *APIToken) error {
	_, err := r.coll.InsertOne(ctx, token)
	if err != nil {
		return fmt.Errorf("insert api token: %w", err)
	}
	return nil
}

func (r *Repo) FindByID(ctx context.Context, id string) (*APIToken, error) {
	var token APIToken
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&token)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrTokenNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find api token: %w", err)
	}
	return &token, nil
}

func (r *Repo) ListByUserID(ctx context.Context, userID string) ([]APIToken, error) {
	cursor, err := r.coll.Find(ctx, bson.M{"UserId": userID})
	if err != nil {
		return nil, fmt.Errorf("find api tokens: %w", err)
	}
	defer cursor.Close(ctx)

	var tokens []APIToken
	if err := cursor.All(ctx, &tokens); err != nil {
		return nil, fmt.Errorf("decode api tokens: %w", err)
	}
	return tokens, nil
}

func (r *Repo) Revoke(ctx context.Context, id string, userID string, revokedAt time.Time) error {
	result, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": id, "UserId": userID},
		bson.M{"$set": bson.M{"RevokedAt": revokedAt}},
	)
	if err != nil {
		return fmt.Errorf("revoke api token: %w", err)
	}
	if result.MatchedCount == 0 {
		return ErrTokenNotFound
	}
	return nil
}

func (r *Repo) UpdateLastUsedAt(ctx context.Context, id string, at time.Time) error {
	_, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{"LastUsedAt": at}},
	)
	if err != nil {
		return fmt.Errorf("update api token last used: %w", err)
	}
	return nil
}
