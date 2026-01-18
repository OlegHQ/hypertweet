package inbox

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
	return &Repo{coll: db.Collection("savedItems")}
}

func (r *Repo) EnsureIndexes(ctx context.Context) error {
	indexes := []mongo.IndexModel{
		{Keys: bson.D{{Key: "UserId", Value: 1}, {Key: "CreatedAt", Value: -1}}},
		{Keys: bson.D{{Key: "UserId", Value: 1}, {Key: "Status", Value: 1}, {Key: "UpdatedAt", Value: -1}}},
		{
			Keys: bson.D{{Key: "UserId", Value: 1}, {Key: "Key", Value: 1}},
			Options: options.Index().
				SetUnique(true).
				SetPartialFilterExpression(bson.M{"Key": bson.M{"$type": "string"}}),
		},
	}
	_, err := r.coll.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		return fmt.Errorf("create inbox indexes: %w", err)
	}
	return nil
}

func (r *Repo) UpsertByKey(ctx context.Context, item *SavedItem) (*SavedItem, error) {
	filter := bson.M{"UserId": item.UserID, "Key": item.Key}
	update := bson.M{"$set": bson.M{
		"Page":      item.Page,
		"UpdatedAt": item.UpdatedAt,
	}}
	setOnInsert := bson.M{
		"_id":           item.ID,
		"UserId":        item.UserID,
		"Key":           item.Key,
		"Status":        item.Status,
		"ReplyVariants": item.ReplyVariants,
		"CreatedAt":     item.CreatedAt,
		"UpdatedAt":     item.UpdatedAt,
	}
	update["$setOnInsert"] = setOnInsert

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
	var out SavedItem
	err := r.coll.FindOneAndUpdate(ctx, filter, update, opts).Decode(&out)
	if err != nil {
		return nil, fmt.Errorf("upsert saved item: %w", err)
	}
	return &out, nil
}

func (r *Repo) FindByID(ctx context.Context, id string) (*SavedItem, error) {
	var item SavedItem
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&item)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrItemNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find saved item: %w", err)
	}
	return &item, nil
}

func (r *Repo) ListByStatus(ctx context.Context, userID, status string, limit int) ([]SavedItem, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	filter := bson.M{"UserId": userID}
	if status != "" {
		filter["Status"] = status
	}
	opts := options.Find().SetSort(bson.D{{Key: "UpdatedAt", Value: -1}}).SetLimit(int64(limit))

	cursor, err := r.coll.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("find saved items: %w", err)
	}
	defer cursor.Close(ctx)

	var items []SavedItem
	if err := cursor.All(ctx, &items); err != nil {
		return nil, fmt.Errorf("decode saved items: %w", err)
	}
	return items, nil
}

func (r *Repo) AddVariants(ctx context.Context, id, userID string, variants []ReplyVariant, updatedAt time.Time) (*SavedItem, error) {
	update := bson.M{
		"$push": bson.M{"ReplyVariants": bson.M{"$each": variants}},
		"$set":  bson.M{"UpdatedAt": updatedAt},
	}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var out SavedItem
	err := r.coll.FindOneAndUpdate(ctx, bson.M{"_id": id, "UserId": userID}, update, opts).Decode(&out)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrItemNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("add variants: %w", err)
	}
	return &out, nil
}

func (r *Repo) UpdateStatus(ctx context.Context, id, userID, status string, updatedAt time.Time) (*SavedItem, error) {
	update := bson.M{"$set": bson.M{"Status": status, "UpdatedAt": updatedAt}}
	opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
	var out SavedItem
	err := r.coll.FindOneAndUpdate(ctx, bson.M{"_id": id, "UserId": userID}, update, opts).Decode(&out)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrItemNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update status: %w", err)
	}
	return &out, nil
}
