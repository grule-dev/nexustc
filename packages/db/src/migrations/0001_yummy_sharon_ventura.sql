CREATE INDEX "post_bookmark_post_id_idx" ON "post_bookmark" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "post_like_post_id_idx" ON "post_like" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "term_post_relation_post_id_idx" ON "term_post_relation" USING btree ("post_id");