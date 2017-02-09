import pandas as ps

# df = ps.DataFrame([['a', 'b'], ['c', 'd']], index=['row 1', 'row 2'], columns=['col 1', 'col 2'])
# print(df)

with open('resources/aggregation/SP500/close.json') as content:
    print(ps.read_json(content, orient='values'))
    print('hello pandas!')
