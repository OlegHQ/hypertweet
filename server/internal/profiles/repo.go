package profiles

import (
	"context"
	"errors"
	"fmt"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProfileRepo struct {
	coll *mongo.Collection
}

func NewProfileRepo(db *mongo.Database) *ProfileRepo {
	return &ProfileRepo{coll: db.Collection("profiles")}
}

func (r *ProfileRepo) FindByID(ctx context.Context, id string) (*Profile, error) {
	var profile Profile
	err := r.coll.FindOne(ctx, bson.M{"_id": id}).Decode(&profile)
	if errors.Is(err, mongo.ErrNoDocuments) {
		return nil, ErrProfileNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("find profile: %w", err)
	}
	return &profile, nil
}

func (r *ProfileRepo) Upsert(ctx context.Context, profile *Profile) error {
	filter := bson.M{"_id": profile.ID}
	update := bson.M{"$set": profile}
	opts := options.Update().SetUpsert(true)

	_, err := r.coll.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		return fmt.Errorf("upsert profile: %w", err)
	}
	return nil
}

func (r *ProfileRepo) UpdateFields(ctx context.Context, id string, updates bson.M) error {
	_, err := r.coll.UpdateOne(ctx,
		bson.M{"_id": id},
		bson.M{"$set": updates},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		return fmt.Errorf("update profile: %w", err)
	}
	return nil
}
