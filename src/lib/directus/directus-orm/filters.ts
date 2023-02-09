/// https://docs.directus.io/reference/filter-rules.html
/* Parsed by snippet
  const table = document.querySelector("table").children[1];
  let output = '';
  for(const {children} of table.children){
      const [operator] = children[1].innerText.split(" ");
      const method = children[2].innerText.toLowerCase().replaceAll("'","").split(" ").map(word => word[0].toUpperCase() + word.slice(1)).join("");
      output += `${method}(field: string, value: FilterValue) {
      this.query[field] = {
        ${operator}: value,
      };
      return this;
    }`
  }
*/

import type { DateTimeFunctions } from './types';

type FilterDynamicValue =
  | '$CURRENT_USER'
  | '$CURRENT_ROLE'
  | '$NOW'
  | `$NOW(${number} ${DateTimeFunctions})`;

type FilterValue = string;

type FilterOperator = {
  [operator: string]: FilterValue;
};

type FilterQuery = {
  [field: string]: FilterOperator | FilterQuery;
};

export class FilterRule {
  private query: FilterQuery = {};

  build() {
    return this.query;
  }

  add(field: string, operator: string, value: FilterValue) {
    if (!(field in this.query)) {
      this.query[field] = {};
    }
    if (!(operator in this.query[field])) {
      this.query[field] = {};
    }
    this.query[field][operator] = value;
  }

  /// Auto generated
  EqualTo(field: string, value: FilterValue) {
    this.add(field, '_eq', value);
    return this;
  }
  NotEqualTo(field: string, value: FilterValue) {
    this.add(field, '_neq', value);
    return this;
  }
  LessThan(field: string, value: FilterValue) {
    this.add(field, '_lt', value);
    return this;
  }
  LessThanOrEqualTo(field: string, value: FilterValue) {
    this.add(field, '_lte', value);
    return this;
  }
  GreaterThan(field: string, value: FilterValue) {
    this.add(field, '_gt', value);
    return this;
  }
  GreaterThanOrEqualTo(field: string, value: FilterValue) {
    this.add(field, '_gte', value);
    return this;
  }
  MatchesAnyOfTheValues(field: string, value: FilterValue) {
    this.add(field, '_in', value);
    return this;
  }
  DoesntMatchAnyOfTheValues(field: string, value: FilterValue) {
    this.add(field, '_nin', value);
    return this;
  }
  IsNull(field: string, value: FilterValue) {
    this.add(field, '_null', value);
    return this;
  }
  IsNotNull(field: string, value: FilterValue) {
    this.add(field, '_nnull', value);
    return this;
  }
  ContainsTheSubstring(field: string, value: FilterValue) {
    this.add(field, '_contains', value);
    return this;
  }
  DoesntContainTheSubstring(field: string, value: FilterValue) {
    this.add(field, '_ncontains', value);
    return this;
  }
  StartsWith(field: string, value: FilterValue) {
    this.add(field, '_starts_with', value);
    return this;
  }
  DoesntStartWith(field: string, value: FilterValue) {
    this.add(field, '_nstarts_with', value);
    return this;
  }
  EndsWith(field: string, value: FilterValue) {
    this.add(field, '_ends_with', value);
    return this;
  }
  DoesntEndWith(field: string, value: FilterValue) {
    this.add(field, '_nends_with', value);
    return this;
  }
  IsBetweenTwoValues(field: string, value: FilterValue) {
    this.add(field, '_between', value);
    return this;
  }
  IsNotBetweenTwoValues(field: string, value: FilterValue) {
    this.add(field, '_nbetween', value);
    return this;
  }
  IsEmpty(field: string, value: FilterValue) {
    this.add(field, '_empty', value);
    return this;
  }
  IsNotEmpty(field: string, value: FilterValue) {
    this.add(field, '_nempty', value);
    return this;
  }
  ValueIntersectsAGivenPoint(field: string, value: FilterValue) {
    this.add(field, '_intersects', value);
    return this;
  }
  ValueDoesNotIntersectAGivenPoint(field: string, value: FilterValue) {
    this.add(field, '_nintersects', value);
    return this;
  }
  ValueIsInABoundingBox(field: string, value: FilterValue) {
    this.add(field, '_intersects_bbox', value);
    return this;
  }
  ValueIsNotInABoundingBox(field: string, value: FilterValue) {
    this.add(field, '_nintersects_bbox', value);
    return this;
  }
}
