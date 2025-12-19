import json


def any_in(lst, content):
    ret = False
    for a in lst:
        if isinstance(a, list):
            ret = ret or any_in(a, content)
        else:
            ret = ret or a in content
    return ret


def extract_with_numbers(lst, content, punctuation_allowed=''):
    if isinstance(content, list):
        for elem in content:
            a, b = extract_with_numbers(lst, elem, punctuation_allowed)
            if a is not None:
                return a, b
        return None, None

    for elem in lst:
        if isinstance(elem, list):
            b = extract_with_numbers(elem, content, punctuation_allowed)[1]
            if b is not None:
                return elem, b
        else:
            if elem in content:
                spt: str = content.split(elem)[1].strip()
                nums = ''
                for a in spt:
                    if a.isdigit() or a in punctuation_allowed:
                        nums += a
                    else:
                        break
                return elem, nums
    return None, None


def main():
    with open('ed_export_course_84647.json', 'r') as fp:
        all_posts: list[dict] = json.load(fp)

    filtered_posts = []
    for post in all_posts:
        phrases_to_look_for = ['special participation a', 'participation section a', 'participation a']
        phrases_to_discard = ['extra credit']

        if (any_in(phrases_to_look_for, post['title'].lower()) and
                not any_in(phrases_to_discard, post['title'].lower())):
            filtered_posts.append(post)

    for post in filtered_posts:
        homework_indicator = ['hwk', 'hw', 'homework']
        to_check = [post['title'], post['content']]
        to_check = [a.lower() for a in to_check]
        hwk_num = extract_with_numbers(homework_indicator, to_check)[1]
        if hwk_num is not None:
            post['homework_number'] = int(hwk_num)
            # print(post['title'], '\n\t-> Homework', post['homework_number'])
        else:
            post['homework_number'] = -1
            # print(post['title'], '\n\t-> Unknown Homework')

    for post in filtered_posts:
        llms = ['deepseek', 'gpt', ['claude', 'opus'], 'gemini', 'mistral', 'grok', 'gemma', 'qwen', 'perplexity', 'llama', 'kimi']
        to_check = [post['title'], post['content']]
        to_check = [a.lower() for a in to_check]
        llm = extract_with_numbers(llms, to_check, punctuation_allowed='.-')
        if llm[0] is not None:
            if isinstance(llm[0], list):
                post['llm'] = llm[0][0].title()
            else:
                post['llm'] = llm[0].title()
        else:
            post['llm'] = 'Unknown'

        print(f'{post['title']}\n\t-> LLM: {post['llm']}')

    with open('filtered_posts.json', 'w') as f:
        json.dump(filtered_posts, f, indent=3)


if __name__ == '__main__':
    main()
