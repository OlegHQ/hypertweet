package tones

import (
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ToneRepo struct {
	coll *mongo.Collection
}

func NewToneRepo(db *mongo.Database) *ToneRepo {
	return &ToneRepo{coll: db.Collection("tones")}
}

func (r *ToneRepo) FindByID(ctx context.Context, id string) (*Tone, error) {
	var tone Tone
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&tone)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrToneNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find tone: %w", err)
	}
	return &tone, nil
}

func (r *ToneRepo) FindByUserID(ctx context.Context, userID string) ([]*Tone, error) {
	cursor, err := r.coll.Find(ctx, bson.M{"UserId": userID})
	if err != nil {
		return nil, fmt.Errorf("find user tones: %w", err)
	}
	defer cursor.Close(ctx)

	var tones []*Tone
	if err := cursor.All(ctx, &tones); err != nil {
		return nil, fmt.Errorf("decode tones: %w", err)
	}
	return tones, nil
}

func (r *ToneRepo) Insert(ctx context.Context, tone *Tone) error {
	_, err := r.coll.InsertOne(ctx, tone)
	if err != nil {
		return fmt.Errorf("insert tone: %w", err)
	}
	return nil
}

func (r *ToneRepo) Update(ctx context.Context, id, title, instruction string) error {
	result, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": bson.M{
			"Title":       title,
			"Instruction": instruction,
		}},
	)
	if err != nil {
		return fmt.Errorf("update tone: %w", err)
	}
	if result.MatchedCount == 0 {
		return ErrToneNotFound
	}
	return nil
}

func (r *ToneRepo) Delete(ctx context.Context, id string) error {
	result, err := r.coll.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return fmt.Errorf("delete tone: %w", err)
	}
	if result.DeletedCount == 0 {
		return ErrToneNotFound
	}
	return nil
}
