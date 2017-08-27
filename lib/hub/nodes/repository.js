class NodeRepository {
	constructor() {
		this._nodes = [];
		this._nodeAbilityMap = new Map();
		this._nodeIdMap = new Map();
	}

	add(node) {
		this._nodeIdMap.set(node.id, node);
		this._nodes.push(node);
	}

	remove(node) {
		this._nodes.splice(this._nodes.indexOf(node), 1);
		this._nodeIdMap.delete(node.id);
		this.setAbilities(node, []);
	}

	setAbilities(node, abilities) {
		for (let [ability, nodes] of this._nodeAbilityMap) {
			const nodeIndex = nodes.findIndex(node);
			if (nodeIndex !== -1) {
				nodes.splice(nodeIndex, 1);
			}
		}

		abilities.forEach(ability => {
			const nodes = this._nodeAbilityMap.get(ability) || [];
			nodes.push(node);
			this._nodeAbilityMap.set(ability, nodes);
		});
	}

	getById(id) {
		return this._nodeIdMap.get(id);
	}

	getByAbility(ability) {
		return this._nodeAbilityMap.get(ability);
	}

	*[Symbol.iterator]() {
		for (let node of this._nodes) {
			yield node;
		}
	}
}

module.exports = NodeRepository;
