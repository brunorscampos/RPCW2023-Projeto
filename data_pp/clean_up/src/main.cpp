#include "json.hpp"

#include <cstdio>
#include <exception>
#include <memory>
#include <optional>
#include <iostream>
#include <regex.h>


static char const* const DOCUMENT_PATTERN {"\\{(.|\n)*\\}"};

struct regex_t_deleter_t {
    void operator()(regex_t* const r) const noexcept {
        regfree(r);
        delete r;
    }
};

struct FILE_deleter_t {
    void operator()(FILE* const f) const noexcept {
        std::fclose(f);
    }
};

struct c_mem_deleter_t {
    void operator()(void* const ptr) const noexcept {
        std::free(ptr);
    }
};

class document_stream_t {

public:
    document_stream_t(
        std::string input_rec_sep,
        std::string const& fn,
        size_t const chunk_size = 4096
    ) :
        m_input_rec_sep{std::move(input_rec_sep)},
        m_ifh{std::unique_ptr<std::FILE, FILE_deleter_t>{std::fopen(fn.c_str(), "r")}},
        m_chunk_size{chunk_size},
        m_buffer_capacity{0},
        m_buffer_size{0},
        m_buffer{std::unique_ptr<char, c_mem_deleter_t>{nullptr}},
        m_doc_regex_obj{std::unique_ptr<regex_t, regex_t_deleter_t>{new regex_t{}}}
        {
            if(regcomp(m_doc_regex_obj.get(), DOCUMENT_PATTERN, REG_EXTENDED) != 0)
                throw std::runtime_error{"Failed to compile regex pattern"};

            if(m_ifh.get() == nullptr)
                throw std::ios::failure{"IO error at constructor for document_stream_t"};

            this->read_chunk();
        }

    std::optional<nlohmann::json> next_document(){

        static std::string document_buffer {};

        char* pos {nullptr};
        do {
            if((pos = std::strstr(m_buffer.get(), m_input_rec_sep.c_str())) != nullptr)
                break;
        }
        while(this->read_chunk() > 0);

        char char_at_pos {};
        if(pos != nullptr){
            char_at_pos = pos[m_input_rec_sep.size()];
            pos[m_input_rec_sep.size()] = '\0';
        }

        std::array<regmatch_t, 1> match_obj {};
        if(
            regexec(
                m_doc_regex_obj.get(),
                m_buffer.get(),
                match_obj.size(),
                match_obj.data(),
                0
            ) == REG_NOMATCH
        )
            return std::nullopt;

        if(pos != nullptr)
            pos[m_input_rec_sep.size()] = char_at_pos;

        char const char_at_rm_eo {m_buffer.get()[match_obj[0].rm_eo]};
        m_buffer.get()[match_obj[0].rm_eo] = '\0';
        document_buffer = m_buffer.get() + match_obj[0].rm_so;
        m_buffer.get()[match_obj[0].rm_eo] = char_at_rm_eo;


        this->adjust_buffer(m_buffer.get() + match_obj[0].rm_eo);
        return std::make_optional(nlohmann::json::parse(document_buffer));
    }

private:
    std::string const m_input_rec_sep;
    std::unique_ptr<std::FILE, FILE_deleter_t> const m_ifh;
    size_t const m_chunk_size;
    size_t m_buffer_capacity;
    size_t m_buffer_size;
    std::unique_ptr<char, c_mem_deleter_t> m_buffer;
    std::unique_ptr<regex_t, regex_t_deleter_t> m_doc_regex_obj;

    size_t read_chunk(){
        if(!this->resize_buffer())
            throw std::bad_alloc();

        size_t const chars_read {std::fread(
            m_buffer.get() + m_buffer_size,
            sizeof(*m_buffer),
            std::min(m_chunk_size, m_buffer_capacity - m_buffer_size),
            m_ifh.get()
        )};
        m_buffer_size += chars_read;

        return chars_read;
    }

    void adjust_buffer(char* src_pos) noexcept {

        size_t i {0};
        m_buffer_size = 0;

        while(*src_pos != '\0' && src_pos != (m_buffer.get() + m_buffer_capacity + 1)){
            ++m_buffer_size;
            *(m_buffer.get() + i) = *src_pos;
            ++src_pos;
            ++i;
        }

        while(src_pos != (m_buffer.get() + m_buffer_capacity + 1)){
            *(m_buffer.get() + i) = *src_pos;
            ++src_pos;
            ++i;
        }

        std::memset(m_buffer.get() + i, 0, (m_buffer_capacity + 1 - i) * sizeof(*m_buffer));
    }

    bool resize_buffer() noexcept {

        if(m_buffer_size == m_buffer_capacity){

            m_buffer_capacity = (m_buffer_capacity == 0) ? m_chunk_size : (m_buffer_capacity * 2);

            char* const new_ptr {
                static_cast<char*>(
                    std::realloc(m_buffer.get(), (m_buffer_capacity + 1) * sizeof(*m_buffer))
                )
            };
            if(new_ptr == nullptr)
                return false;

            std::memset(
                new_ptr + m_buffer_size,
                0,
                (m_buffer_capacity + 1 - m_buffer_size) * sizeof(*new_ptr)
            );

            static_cast<void>(m_buffer.release());
            m_buffer.reset(new_ptr);
        }

        return true;
    }
};

int main(){

    document_stream_t doc_stream {"    },", "../datasets/atco1_acordaos.json"};
    size_t doc_count {0};
    while(true){

        std::optional<nlohmann::json> const j {doc_stream.next_document()};
        if(j.has_value()){
            ++doc_count;
            if(j.value().find("Nº do Documento") != j.value().end())
                std::cout << j.value().find("Nº do Documento").value() << std::endl;
        }
        else
            break;
    }

    std::cout << doc_count << " documents\n";

    return 0;
}
