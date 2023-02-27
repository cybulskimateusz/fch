class PointsCounter {
    static groupPoints(points, distance) {
        const summary = []

        points.forEach(([x, y]) => {
            const groupOfClosestClicks = summary.find(group =>
                group.find(click =>
                    _.inRange(click[0], x - distance, x + distance)
                    && _.inRange(click[1], y - distance, y + distance))
            )

            if (groupOfClosestClicks) {
                groupOfClosestClicks.push([x, y])
            } else {
                summary.push([[x, y]])
            }
        })

        return {
            groups: summary,
            allVotes: points.length,
        }
    }

    static getClickStatistics(summary, optionsAmount) {
        return summary
            .map(vote => {
                const x = vote.reduce((sum, next) => sum + next[0], 0) / vote.length
                const y = vote.reduce((sum, next) => sum + next[1], 0) / vote.length
                return {
                    point: [x, y],
                    votes: vote.length
                }
            })
            .sort((p, n) => n.votes - p.votes)
            .slice(0, optionsAmount)
    }
}
