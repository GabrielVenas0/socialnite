
/*
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import neo4j from 'neo4j-driver';

const neo4jUrl = process.env.NEO4J_URL;
const neo4jUser = process.env.NEO4J_USER;
const neo4jPassword = process.env.NEO4J_PASSWORD;

const driver = neo4jUrl && neo4jUser && neo4jPassword
	? neo4j.driver(
		neo4jUrl,
		neo4j.auth.basic(neo4jUser, neo4jPassword),
	)
	: null;
